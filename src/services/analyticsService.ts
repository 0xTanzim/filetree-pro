import * as vscode from 'vscode';
import { AnalyticsData, FileTreeItem } from '../types';
import { formatFileSize } from '../utils/fileUtils';

export class AnalyticsService {
  private analyticsData: AnalyticsData | null = null;
  private isInitialized = false;

  constructor() {
    this.analyticsData = {
      totalFiles: 0,
      totalFolders: 0,
      totalSize: 0,
      fileTypes: {},
      largestFiles: [],
      recentFiles: [],
      projectStructure: {
        depth: 0,
        maxDepth: 0,
        averageFilesPerFolder: 0,
      },
      fileTypeDistribution: {},
      projectSummary: '',
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.generateAnalytics();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing analytics:', error);
      throw error;
    }
  }

  async getProjectAnalytics(): Promise<AnalyticsData> {
    if (!this.analyticsData) {
      await this.generateAnalytics();
    }
    return this.analyticsData!;
  }

  private async generateAnalytics(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      this.analyticsData = this.getEmptyAnalytics();
      return;
    }

    try {
      const allFiles: FileTreeItem[] = [];
      const fileTypes: Record<string, number> = {};
      let totalSize = 0;
      let maxDepth = 0;

      // Collect all files recursively
      for (const folder of workspaceFolders) {
        await this.collectFilesRecursively(folder.uri, allFiles, fileTypes, 0);
      }

      // Calculate statistics
      for (const file of allFiles) {
        if (file.size) {
          totalSize += file.size;
        }
      }

      // Find largest files
      const largestFiles = allFiles
        .filter(file => file.size)
        .sort((a, b) => (b.size || 0) - (a.size || 0))
        .slice(0, 10);

      // Find recent files
      const recentFiles = allFiles
        .filter(file => file.modifiedDate)
        .sort((a, b) => (b.modifiedDate?.getTime() || 0) - (a.modifiedDate?.getTime() || 0))
        .slice(0, 10);

      // Calculate project structure metrics
      const totalFolders = allFiles.filter(file => file.type === 'folder').length;
      const averageFilesPerFolder = totalFolders > 0 ? allFiles.length / totalFolders : 0;

      this.analyticsData = {
        totalFiles: allFiles.filter(file => file.type === 'file').length,
        totalFolders,
        totalSize,
        fileTypes,
        largestFiles,
        recentFiles,
        projectStructure: {
          depth: maxDepth,
          maxDepth,
          averageFilesPerFolder,
        },
        fileTypeDistribution: fileTypes,
        projectSummary: `Project contains ${allFiles.filter(file => file.type === 'file').length} files and ${totalFolders} folders with a total size of ${(totalSize / (1024 * 1024)).toFixed(2)} MB.`,
      };
    } catch (error) {
      console.error('Error generating analytics:', error);
      this.analyticsData = this.getEmptyAnalytics();
    }
  }

  private async collectFilesRecursively(
    uri: vscode.Uri,
    allFiles: FileTreeItem[],
    fileTypes: Record<string, number>,
    depth: number
  ): Promise<void> {
    try {
      const entries = await vscode.workspace.fs.readDirectory(uri);

      for (const [name, type] of entries) {
        const itemUri = vscode.Uri.joinPath(uri, name);

        // Skip excluded files
        if (this.isExcluded(name)) {
          continue;
        }

        const item: FileTreeItem = {
          uri: itemUri,
          name,
          type: type === vscode.FileType.Directory ? 'folder' : 'file',
        };

        // Get file details
        if (item.type === 'file') {
          try {
            const stat = await vscode.workspace.fs.stat(itemUri);
            item.size = stat.size;
            item.modifiedDate = new Date(stat.mtime);

            // Count file types
            const ext = this.getFileExtension(name);
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;
          } catch (error) {
            console.error('Error getting file stats:', error);
          }
        }

        allFiles.push(item);

        // Recursively process folders
        if (item.type === 'folder') {
          await this.collectFilesRecursively(itemUri, allFiles, fileTypes, depth + 1);
        }
      }
    } catch (error) {
      console.error('Error reading directory:', error);
    }
  }

  private isExcluded(name: string): boolean {
    const exclusions = [
      'node_modules',
      'dist',
      'build',
      'out',
      '.git',
      '.venv',
      'venv',
      'env',
      '.env',
      'target',
      'bin',
      'obj',
      '.vs',
      '.idea',
      '*.pyc',
      '*.log',
      '*.tmp',
      '*.cache',
    ];

    return exclusions.some(exclusion => {
      if (exclusion.includes('*')) {
        const pattern = exclusion.replace(/\*/g, '.*');
        return new RegExp(pattern).test(name);
      }
      return name === exclusion;
    });
  }

  private getFileExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ext ? `.${ext}` : 'no-extension';
  }

  private getEmptyAnalytics(): AnalyticsData {
    return {
      totalFiles: 0,
      totalFolders: 0,
      totalSize: 0,
      fileTypes: {},
      largestFiles: [],
      recentFiles: [],
      projectStructure: {
        depth: 0,
        maxDepth: 0,
        averageFilesPerFolder: 0,
      },
      fileTypeDistribution: {},
      projectSummary: '',
    };
  }

  getAnalytics(): AnalyticsData {
    if (!this.analyticsData) {
      return {
        totalFiles: 0,
        totalFolders: 0,
        totalSize: 0,
        fileTypes: {},
        largestFiles: [],
        recentFiles: [],
        projectStructure: {
          depth: 0,
          maxDepth: 0,
          averageFilesPerFolder: 0,
        },
        fileTypeDistribution: {},
        projectSummary: '',
      };
    }
    return this.analyticsData;
  }

  getFileTypeDistribution(): Record<string, number> {
    if (!this.analyticsData?.fileTypes) {
      return {};
    }
    return this.analyticsData.fileTypes;
  }

  getLargestFiles(): FileTreeItem[] {
    return this.analyticsData?.largestFiles || [];
  }

  getRecentFiles(): FileTreeItem[] {
    return this.analyticsData?.recentFiles || [];
  }

  getProjectSummary(): string {
    if (!this.analyticsData) {
      return 'No project data available';
    }

    const { totalFiles, totalFolders, totalSize, fileTypes } = this.analyticsData;
    const sizeFormatted = formatFileSize(totalSize);
    const fileTypeCount = Object.keys(fileTypes || {}).length;

    return `📊 Project Summary:
• ${totalFiles} files
• ${totalFolders} folders
• ${sizeFormatted} total size
• ${fileTypeCount} file types`;
  }

  async refreshAnalytics(): Promise<void> {
    this.analyticsData = null;
    await this.generateAnalytics();
  }

  dispose(): void {
    this.analyticsData = null;
    this.isInitialized = false;
  }
}
