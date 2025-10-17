import * as path from 'path';
import * as vscode from 'vscode';
import { ExclusionPattern, ExtensionConfig, FileSystemStats, FileTreeItem } from '../types';
import { CacheManager, createCache } from '../utils/cacheManager';
import { ErrorCategory, ErrorSeverity, getErrorHandler } from '../utils/errorHandler';
import { getFileTypeInfo } from '../utils/fileUtils';
import {
  validateExclusionPatterns,
  validateFileSize,
  validatePath,
  validatePattern,
} from '../utils/securityUtils';

/**
 * File system service with caching, security validation, and performance optimization.
 * Uses LRU cache to prevent memory leaks and validates all inputs for security.
 *
 * @since 0.2.0
 */
export class FileSystemService {
  private cache: CacheManager<string, FileTreeItem>;
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
  private errorHandler = getErrorHandler();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.initializeExclusionPatterns();

    // Initialize LRU cache with 100 entries and 5-minute TTL
    this.cache = createCache<string, FileTreeItem>(100, 5);

    // Start periodic cache cleanup (every 5 minutes)
    this.cleanupInterval = setInterval(
      () => {
        const expired = this.cache.cleanup();
        if (expired > 0) {
          console.log(`[FileSystemService] Cleaned up ${expired} expired cache entries`);
        }
      },
      5 * 60 * 1000
    );
  }

  private loadConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('filetree-pro');
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

    // Add user-defined exclusions with validation
    const userExclusions = this.config.exclude || [];
    const validationResult = validateExclusionPatterns(userExclusions);

    if (!validationResult.valid) {
      this.errorHandler.handleError({
        message: `Invalid exclusion patterns: ${validationResult.error}`,
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.SECURITY,
        context: { patterns: userExclusions },
        timestamp: new Date(),
      });
      // Use only default patterns if user patterns are invalid
      return;
    }

    // Add validated user patterns
    userExclusions.forEach(pattern => {
      const patternValidation = validatePattern(pattern);
      if (patternValidation.valid) {
        this.exclusionPatterns.push({
          pattern,
          type: pattern.includes('*') ? 'glob' : 'exact',
        });
      }
    });
  }

  async getFileTree(uri: vscode.Uri, depth: number = 0): Promise<FileTreeItem[]> {
    const startTime = Date.now();
    const cacheKey = `${uri.fsPath}-${depth}`;

    // Validate path for security
    const pathValidation = validatePath(uri.fsPath);
    if (!pathValidation.valid) {
      await this.errorHandler.handleError(
        this.errorHandler.createSecurityError(`Invalid path: ${pathValidation.error}`, {
          path: uri.fsPath,
        })
      );
      if (this.stats.errorCount !== undefined) {
        this.stats.errorCount += 1;
      }
      return [];
    }

    // Check cache first
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      // Update cache statistics
      const cacheStats = this.cache.getStatistics();
      this.stats.cacheHitRate = cacheStats.hitRate;
      return cachedResult.children || [];
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
          this.stats.totalFiles += 1;
        } else {
          this.stats.totalFolders += 1;
          if (depth < this.config.maxDepth) {
            // Recursively get children for folders
            const children = await this.getFileTree(itemUri, depth + 1);
            if (children.length > 0) {
              item.children = children;
            }
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

      // Cache the result with LRU eviction
      const cacheItem: FileTreeItem = {
        uri,
        name: path.basename(uri.fsPath),
        type: 'folder',
        children: items,
      };
      this.cache.set(cacheKey, cacheItem);

      if (this.stats.readTime !== undefined) {
        this.stats.readTime += Date.now() - startTime;
      }

      // Update cache statistics
      const cacheStats = this.cache.getStatistics();
      this.stats.cacheHitRate = cacheStats.hitRate;

      return items;
    } catch (error) {
      if (this.stats.errorCount !== undefined) {
        this.stats.errorCount += 1;
      }
      await this.errorHandler.handleError(
        this.errorHandler.createFileSystemError('Error reading directory', error as Error, {
          path: uri.fsPath,
          depth,
        })
      );
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

          // Validate file size for security
          const sizeValidation = validateFileSize(stat.size);
          if (!sizeValidation.valid) {
            await this.errorHandler.handleError({
              message: `File too large: ${sizeValidation.error}`,
              severity: ErrorSeverity.WARNING,
              category: ErrorCategory.SECURITY,
              context: { path: item.uri.fsPath, size: stat.size },
              timestamp: new Date(),
            });
            return;
          }

          if (this.config.showFileSize) {
            item.size = stat.size;
            this.stats.totalSize += stat.size;
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
      await this.errorHandler.handleError(
        this.errorHandler.createFileSystemError('Error getting file details', error as Error, {
          path: item.uri?.fsPath,
        })
      );
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
      // Validate path
      const pathValidation = validatePath(uri.fsPath);
      if (!pathValidation.valid) {
        await this.errorHandler.handleError(
          this.errorHandler.createSecurityError(`Invalid path: ${pathValidation.error}`, {
            path: uri.fsPath,
          })
        );
        return '';
      }

      // Check file size before reading
      const stat = await vscode.workspace.fs.stat(uri);
      const sizeValidation = validateFileSize(stat.size);
      if (!sizeValidation.valid) {
        await this.errorHandler.handleError({
          message: `File too large to read: ${sizeValidation.error}`,
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.SECURITY,
          context: { path: uri.fsPath, size: stat.size },
          timestamp: new Date(),
        });
        return '';
      }

      const content = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(content).toString('utf8');
    } catch (error) {
      await this.errorHandler.handleError(
        this.errorHandler.createFileSystemError('Error reading file content', error as Error, {
          path: uri.fsPath,
        })
      );
      return '';
    }
  }

  getStats(): FileSystemStats {
    // Calculate average file size
    if (this.stats.totalFiles > 0) {
      this.stats.averageFileSize = this.stats.totalSize / this.stats.totalFiles;
    }
    return { ...this.stats };
  }

  refreshConfig(): void {
    this.config = this.loadConfig();
    this.initializeExclusionPatterns();
    this.clearCache();
  }

  clearCache(): void {
    const cleared = this.cache.clear();
    console.log(`[FileSystemService] Cleared ${cleared} cache entries`);
  }

  dispose(): void {
    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.clearCache();
  }
}
