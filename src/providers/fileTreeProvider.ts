import * as vscode from 'vscode';
import { AnalyticsService } from '../services/analyticsService';
import { CopilotService } from '../services/copilotService';
import { FileSystemService } from '../services/fileSystemService';
import { FileTreeItem } from '../types';
import { formatDate, formatFileSize, getFileIcon } from '../utils/fileUtils';

export class FileTreeProvider implements vscode.TreeDataProvider<FileTreeItem> {
  // Event emitter for tree changes (Official VS Code API pattern)
  private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | null | void> =
    new vscode.EventEmitter<FileTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  // Chunked loading configuration
  private static readonly CHUNK_SIZE = 100; // Load 100 items at a time
  private loadingChunks: Map<string, boolean> = new Map(); // Track loading state

  constructor(
    private fileSystemService: FileSystemService,
    private copilotService: CopilotService,
    private analyticsService: AnalyticsService
  ) {}

  getTreeItem(element: FileTreeItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element.name);

    // Set collapsible state
    if (element.type === 'folder') {
      treeItem.collapsibleState =
        element.children && element.children.length > 0
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None;
    } else {
      treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    // Set icon and color - will be used for custom icons later
    // const icon = getFileIcon(element.name);
    // const color = getFileColor(element.name);

    treeItem.iconPath = new vscode.ThemeIcon('file');
    treeItem.description = this.getDescription(element);
    treeItem.tooltip = this.getTooltip(element);
    treeItem.contextValue = element.contextValue || element.type;
    if (element.uri) {
      treeItem.resourceUri = element.uri;
    }

    // Add command for files
    if (element.type === 'file' && element.uri) {
      treeItem.command = {
        command: 'filetree-pro.openFile',
        title: 'Open File',
        arguments: [element.uri],
      };
    }

    return treeItem;
  }

  /**
   * ✅ Get children for tree node - implements lazy loading
   * Called by VS Code when user expands a node (on-demand)
   * Implements chunked loading for large directories
   */
  async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
    if (!vscode.workspace.workspaceFolders) {
      return [];
    }

    try {
      if (!element) {
        // Root level - get workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const items: FileTreeItem[] = [];

        for (const folder of workspaceFolders) {
          const children = await this.fileSystemService.getFileTree(folder.uri);
          items.push({
            uri: folder.uri,
            name: folder.name,
            type: 'folder',
            children,
          });
        }

        return items;
      } else {
        // Get children of the current element with chunked loading
        if (element.type === 'folder' && element.uri) {
          return await this.getChildrenChunked(element);
        }
        return [];
      }
    } catch (error) {
      console.error('Error getting children:', error);
      vscode.window.showErrorMessage(`Failed to load children: ${error}`);
      return [];
    }
  }

  /**
   * ✅ Load children in chunks for large directories
   * Shows first chunk immediately, loads rest progressively
   */
  private async getChildrenChunked(element: FileTreeItem): Promise<FileTreeItem[]> {
    if (!element.uri) {
      return [];
    }

    const cacheKey = element.uri.fsPath;

    // If already loaded, return from cache
    if (element.children && element.children.length > 0) {
      return element.children;
    }

    // Load all children
    const allChildren = await this.fileSystemService.getFileTree(element.uri);

    // If small directory, return all at once
    if (allChildren.length <= FileTreeProvider.CHUNK_SIZE) {
      return allChildren;
    }

    // Large directory - return first chunk immediately
    const firstChunk = allChildren.slice(0, FileTreeProvider.CHUNK_SIZE);

    // Schedule loading remaining chunks in background
    if (!this.loadingChunks.get(cacheKey)) {
      this.loadingChunks.set(cacheKey, true);
      this.loadRemainingChunks(element, allChildren.slice(FileTreeProvider.CHUNK_SIZE));
    }

    return firstChunk;
  }

  /**
   * ✅ Load remaining chunks progressively in background
   */
  private async loadRemainingChunks(
    parent: FileTreeItem,
    remaining: FileTreeItem[]
  ): Promise<void> {
    // Load in chunks with small delay between each
    for (let i = 0; i < remaining.length; i += FileTreeProvider.CHUNK_SIZE) {
      const chunk = remaining.slice(i, i + FileTreeProvider.CHUNK_SIZE);

      // Add chunk to parent's children
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(...chunk);

      // Fire refresh event for this parent (incremental update)
      this._onDidChangeTreeData.fire(parent);

      // Small delay to avoid blocking UI
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Clear loading flag
    if (parent.uri) {
      this.loadingChunks.delete(parent.uri.fsPath);
    }
  }

  private getDescription(element: FileTreeItem): string {
    const parts: string[] = [];

    if (element.size !== undefined) {
      parts.push(formatFileSize(element.size));
    }

    if (element.modifiedDate) {
      parts.push(formatDate(element.modifiedDate));
    }

    return parts.join(' • ');
  }

  private getTooltip(element: FileTreeItem): string {
    const parts: string[] = [];

    parts.push(`Name: ${element.name}`);
    parts.push(`Type: ${element.type}`);
    if (element.uri) {
      parts.push(`Path: ${element.uri.fsPath}`);
    }

    if (element.size !== undefined) {
      parts.push(`Size: ${formatFileSize(element.size)}`);
    }

    if (element.modifiedDate) {
      parts.push(`Modified: ${formatDate(element.modifiedDate)}`);
    }

    // Add Copilot analysis if available
    if (element.type === 'file' && element.uri && this.copilotService.isAvailable()) {
      const analysis = this.copilotService.getFileAnalysis(element.uri);
      if (analysis?.summary) {
        parts.push(`AI Summary: ${analysis.summary}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * ✅ Refresh entire tree or specific element (Official VS Code API pattern)
   * @param element - Optional element to refresh (undefined = refresh all)
   */
  refresh(element?: FileTreeItem): void {
    // Clear chunk loading state if refreshing
    if (!element) {
      this.loadingChunks.clear();
    } else if (element.uri) {
      this.loadingChunks.delete(element.uri.fsPath);
    }

    this._onDidChangeTreeData.fire(element);
  }

  setRootPath(path: string): void {
    // This method allows setting a specific root path for the tree
    // The tree will refresh and show the contents of the specified path
    this._onDidChangeTreeData.fire();
  }

  async expandItem(element: FileTreeItem): Promise<void> {
    if (element.type === 'folder') {
      const children = await this.getChildren(element);
      element.children = children;
      this._onDidChangeTreeData.fire(element);
    }
  }

  async collapseItem(element: FileTreeItem): Promise<void> {
    if (element.type === 'folder') {
      element.children = [];
      this._onDidChangeTreeData.fire(element);
    }
  }

  async search(query: string): Promise<FileTreeItem[]> {
    return await this.fileSystemService.searchFiles(query);
  }

  async getAnalytics(): Promise<any> {
    return await this.analyticsService.getProjectAnalytics();
  }

  async exportTree(format: string): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error('No workspace folders found');
    }

    const rootItems = await this.getChildren();
    return this.exportToFormat(rootItems, format);
  }

  private exportToFormat(items: FileTreeItem[], format: string): string {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(items, null, 2);
      case 'markdown':
        return this.exportToMarkdown(items);
      case 'ascii':
        return this.exportToAscii(items);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private exportToMarkdown(items: FileTreeItem[], level: number = 0): string {
    let result = '';
    const indent = '  '.repeat(level);

    for (const item of items) {
      const icon = getFileIcon(item.name);
      const size = item.size ? ` (${formatFileSize(item.size)})` : '';
      result += `${indent}- ${icon} ${item.name}${size}\n`;

      if (item.children && item.children.length > 0) {
        result += this.exportToMarkdown(item.children, level + 1);
      }
    }

    return result;
  }

  private exportToAscii(items: FileTreeItem[], prefix: string = ''): string {
    let result = '';

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isLast = i === items.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const icon = getFileIcon(item.name);

      result += `${prefix}${connector}${icon} ${item.name}\n`;

      if (item.children && item.children.length > 0) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        result += this.exportToAscii(item.children, newPrefix);
      }
    }

    return result;
  }
}
