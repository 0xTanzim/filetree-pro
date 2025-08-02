import * as vscode from 'vscode';

// File Tree Item Interface
export interface FileTreeItem {
  name: string;
  path?: string; // Make path optional
  type: 'file' | 'folder';
  uri?: vscode.Uri; // Add uri property
  size?: number;
  modifiedDate?: Date;
  children?: FileTreeItem[];
  collapsibleState?: vscode.TreeItemCollapsibleState;
  iconPath?: string | vscode.ThemeIcon;
  tooltip?: string;
  description?: string;
  contextValue?: string;
}

// File Tree Provider Options
export interface FileTreeProviderOptions {
  excludePatterns?: string[];
  maxDepth?: number;
  showFileSize?: boolean;
  showFileDate?: boolean;
  enableSearch?: boolean;
}

// Exclusion Pattern Interface
export interface ExclusionPattern {
  pattern: string;
  enabled?: boolean; // Make enabled optional
  type?: 'exact' | 'glob'; // Add type property
  description?: string;
}

// Search Options Interface
export interface SearchOptions {
  query: string;
  caseSensitive?: boolean;
  includeHidden?: boolean;
  fileTypes?: string[];
  maxResults?: number;
}

// Export Options Interface
export interface ExportOptions {
  format: 'json' | 'markdown' | 'ascii' | 'svg';
  includeHidden?: boolean;
  maxDepth?: number;
  outputPath?: string;
}

// Analytics Data Interface
export interface AnalyticsData {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  fileTypeDistribution: Record<string, number>;
  fileTypes?: Record<string, number>; // Add for backward compatibility
  largestFiles: FileTreeItem[];
  recentFiles: FileTreeItem[];
  projectSummary: string;
  projectStructure?: any; // Add for backward compatibility
}

// Copilot Analysis Interface
export interface CopilotAnalysis {
  summary: string;
  complexity: 'low' | 'medium' | 'high';
  suggestions: string[];
  tags?: string[]; // Make optional
  confidence?: number; // Make optional
  recommendations?: string[]; // Add for backward compatibility
}

// File System Statistics Interface
export interface FileSystemStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  averageFileSize: number;
  largestFile?: FileTreeItem;
  mostRecentFile?: FileTreeItem;
  readTime?: number; // Add for performance tracking
  errorCount?: number; // Add for error tracking
  cacheHitRate?: number; // Add for cache tracking
  writeTime?: number; // Add for backward compatibility
}

// Tree View State Interface
export interface TreeViewState {
  expandedItems: string[];
  selectedItems: string[];
  scrollPosition: number;
  searchQuery?: string;
  filters: Record<string, boolean>;
}

// Extension Configuration Interface
export interface ExtensionConfig {
  exclude: string[];
  useCopilot: boolean;
  maxDepth: number;
  showFileSize: boolean;
  showFileDate: boolean;
  enableSearch: boolean;
  enableAnalytics: boolean;
}

// Command Context Interface
export interface CommandContext {
  fileTreeProvider: any;
  fileSystemService: any;
  copilotService: any;
  analyticsService: any;
}

// File Type Information Interface
export interface FileTypeInfo {
  type: string;
  extensions: string[];
  icon: string;
  color?: string;
  description?: string;
}

// Search Result Interface
export interface SearchResult {
  item: FileTreeItem;
  matchType: 'name' | 'content' | 'path';
  relevance: number;
  highlights: string[];
}
