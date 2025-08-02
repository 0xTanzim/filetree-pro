import * as path from 'path';
import * as vscode from 'vscode';
import { ExclusionPattern, ExtensionConfig, FileSystemStats, FileTreeItem } from '../types';
import { getFileTypeInfo } from '../utils/fileUtils';

export class FileSystemService {
  private cache = new Map<string, FileTreeItem>();
  private stats: FileSystemStats = {
    readTime: 0,
    writeTime: 0,
    errorCount: 0,
    cacheHitRate: 0,
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    averageFileSize: 0,
  };
  private config: ExtensionConfig;
  private exclusionPatterns: ExclusionPattern[] = [];

  constructor() {
    this.config = this.loadConfig();
    this.initializeExclusionPatterns();
  }

  private loadConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('filetreeproai');
    return {
      exclude: config.get('exclude', []),
      useCopilot: config.get('useCopilot', true),
      maxDepth: config.get('maxDepth', 10),
      showFileSize: config.get('showFileSize', true),
      showFileDate: config.get('showFileDate', false),
      enableSearch: config.get('enableSearch', true),
      enableAnalytics: config.get('enableAnalytics', true),
    };
  }

  private initializeExclusionPatterns(): void {
    this.exclusionPatterns = [
      // Default exclusions
      { pattern: 'node_modules', type: 'exact' },
      { pattern: 'dist', type: 'exact' },
      { pattern: 'build', type: 'exact' },
      { pattern: 'out', type: 'exact' },
      { pattern: '.git', type: 'exact' },
      { pattern: '.venv', type: 'exact' },
      { pattern: 'venv', type: 'exact' },
      { pattern: 'env', type: 'exact' },
      { pattern: '.env', type: 'exact' },
      { pattern: 'target', type: 'exact' },
      { pattern: 'bin', type: 'exact' },
      { pattern: 'obj', type: 'exact' },
      { pattern: '.vs', type: 'exact' },
      { pattern: '.idea', type: 'exact' },
      { pattern: '*.pyc', type: 'glob' },
      { pattern: '*.log', type: 'glob' },
      { pattern: '*.tmp', type: 'glob' },
      { pattern: '*.cache', type: 'glob' },
    ];

    // Add user-defined exclusions
    this.config.exclude.forEach(pattern => {
      this.exclusionPatterns.push({
        pattern,
        type: pattern.includes('*') ? 'glob' : 'exact',
      });
    });
  }

  async getFileTree(uri: vscode.Uri, depth: number = 0): Promise<FileTreeItem[]> {
    const startTime = Date.now();
    const cacheKey = `${uri.fsPath}-${depth}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      if (this.stats.cacheHitRate !== undefined) {
        this.stats.cacheHitRate += 1;
      }
      return this.cache.get(cacheKey)!.children || [];
    }

    try {
      const items: FileTreeItem[] = [];
      const entries = await vscode.workspace.fs.readDirectory(uri);

      for (const [name, type] of entries) {
        const itemUri = vscode.Uri.joinPath(uri, name);

        // Check if item should be excluded
        if (this.isExcluded(name, itemUri)) {
          continue;
        }

        const item: FileTreeItem = {
          uri: itemUri,
          name,
          type: type === vscode.FileType.Directory ? 'folder' : 'file',
        };

        // Get additional file information if needed
        if (item.type === 'file') {
          await this.addFileDetails(item);
        } else if (depth < this.config.maxDepth) {
          // Recursively get children for folders
          const children = await this.getFileTree(itemUri, depth + 1);
          if (children.length > 0) {
            item.children = children;
          }
        }

        items.push(item);
      }

      // Sort items: folders first, then files
      items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      // Cache the result
      this.cache.set(cacheKey, {
        uri,
        name: path.basename(uri.fsPath),
        type: 'folder',
        children: items,
      });

      if (this.stats.readTime !== undefined) {
        this.stats.readTime += Date.now() - startTime;
      }
      return items;
    } catch (error) {
      if (this.stats.errorCount !== undefined) {
        this.stats.errorCount += 1;
      }
      console.error('Error reading directory:', error);
      return [];
    }
  }

  private isExcluded(name: string, _uri: vscode.Uri): boolean {
    return this.exclusionPatterns.some(pattern => {
      switch (pattern.type) {
        case 'exact':
          return name === pattern.pattern;
        case 'glob':
          return this.matchesGlob(name, pattern.pattern);
        default:
          return false;
      }
    });
  }

  private matchesGlob(name: string, pattern: string): boolean {
    // Simple glob matching - can be enhanced with a proper glob library
    const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(name);
  }

  private async addFileDetails(item: FileTreeItem): Promise<void> {
    try {
      if (this.config.showFileSize || this.config.showFileDate) {
        if (item.uri) {
          const stat = await vscode.workspace.fs.stat(item.uri);

          if (this.config.showFileSize) {
            item.size = stat.size;
          }

          if (this.config.showFileDate) {
            item.modifiedDate = new Date(stat.mtime);
          }
        }
      }

      // Add file type context
      const fileTypeInfo = getFileTypeInfo(item.name);
      item.contextValue = `file-${fileTypeInfo.type}`;
    } catch (error) {
      console.error('Error getting file details:', error);
    }
  }

  async searchFiles(query: string, _options: any = {}): Promise<FileTreeItem[]> {
    if (!this.config.enableSearch) {
      return [];
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }

    try {
      const pattern = `**/*${query}*`;
      const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');

      return files.map(uri => ({
        uri,
        name: path.basename(uri.fsPath),
        type: 'file' as const,
        contextValue: 'search-result',
      }));
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  async getFileContent(uri: vscode.Uri): Promise<string> {
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(content).toString('utf8');
    } catch (error) {
      console.error('Error reading file content:', error);
      return '';
    }
  }

  getStats(): FileSystemStats {
    return { ...this.stats };
  }

  refreshConfig(): void {
    this.config = this.loadConfig();
    this.initializeExclusionPatterns();
    this.clearCache();
  }

  clearCache(): void {
    this.cache.clear();
  }

  dispose(): void {
    this.clearCache();
  }
}
