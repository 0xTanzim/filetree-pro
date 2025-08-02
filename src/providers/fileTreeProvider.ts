import * as vscode from 'vscode';
import { AnalyticsService } from '../services/analyticsService';
import { CopilotService } from '../services/copilotService';
import { FileSystemService } from '../services/fileSystemService';
import { FileTreeItem } from '../types';
import { formatDate, formatFileSize, getFileIcon } from '../utils/fileUtils';

export class FileTreeProvider implements vscode.TreeDataProvider<FileTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | null | void> =
    new vscode.EventEmitter<FileTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

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
        command: 'filetreeproai.openFile',
        title: 'Open File',
        arguments: [element.uri],
      };
    }

    return treeItem;
  }

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
        // Get children of the current element
        if (element.type === 'folder' && element.uri) {
          return await this.fileSystemService.getFileTree(element.uri);
        }
        return [];
      }
    } catch (error) {
      console.error('Error getting children:', error);
      return [];
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

  refresh(): void {
    this._onDidChangeTreeData.fire();
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
