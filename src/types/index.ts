import * as vscode from 'vscode';

export interface FileTreeItem {
  uri: vscode.Uri;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modifiedDate?: Date;
  children?: FileTreeItem[];
  isExcluded?: boolean;
  contextValue?: string;
}

export interface FileTreeProviderOptions {
  maxDepth?: number;
  showFileSize?: boolean;
  showFileDate?: boolean;
  enableSearch?: boolean;
  enableAnalytics?: boolean;
}

export interface ExclusionPattern {
  pattern: string;
  type: 'exact' | 'glob' | 'regex';
  description?: string;
}

export interface SearchOptions {
  query: string;
  caseSensitive?: boolean;
  useRegex?: boolean;
  includeFiles?: boolean;
  includeFolders?: boolean;
  fileTypes?: string[];
}

export interface ExportOptions {
  format: 'json' | 'markdown' | 'svg' | 'ascii';
  includeSize?: boolean;
  includeDate?: boolean;
  maxDepth?: number;
  outputPath?: string;
}

export interface AnalyticsData {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  largestFiles: FileTreeItem[];
  recentFiles: FileTreeItem[];
  projectStructure: {
    depth: number;
    maxDepth: number;
    averageFilesPerFolder: number;
  };
  fileTypeDistribution: Record<string, number>;
  projectSummary: string;
}

export interface CopilotAnalysis {
  summary?: string;
  suggestions?: string[];
  complexity?: 'low' | 'medium' | 'high';
  recommendations?: string[];
}

export interface FileSystemStats {
  readTime: number;
  writeTime: number;
  errorCount: number;
  cacheHitRate: number;
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  averageFileSize: number;
}

export interface TreeViewState {
  expandedItems: Set<string>;
  selectedItems: Set<string>;
  searchQuery?: string;
  filters: Record<string, boolean>;
}

export interface ExtensionConfig {
  exclude: string[];
  useCopilot: boolean;
  maxDepth: number;
  showFileSize: boolean;
  showFileDate: boolean;
  enableSearch: boolean;
  enableAnalytics: boolean;
}

export interface CommandContext {
  fileTreeProvider: any;
  fileSystemService: any;
  copilotService: any;
  analyticsService: any;
}

export type FileType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'document'
  | 'code'
  | 'config'
  | 'binary'
  | 'unknown';

export interface FileTypeInfo {
  type: FileType;
  icon: string;
  color?: string;
  extensions: string[];
}

export interface SearchResult {
  item: FileTreeItem;
  matchType: 'name' | 'content' | 'path';
  relevance: number;
  highlights: { start: number; end: number }[];
}
