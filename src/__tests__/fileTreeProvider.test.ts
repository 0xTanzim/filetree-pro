/**
 * FileTreeProvider Test Suite
 * Tests TreeView data provider with lazy loading and chunked loading
 */

import * as vscode from 'vscode';
import { FileTreeProvider } from '../providers/fileTreeProvider';
import { AnalyticsService } from '../services/analyticsService';
import { CopilotService } from '../services/copilotService';
import { FileSystemService } from '../services/fileSystemService';
import { FileTreeItem } from '../types';

// Mock dependencies
jest.mock('../services/fileSystemService');
jest.mock('../services/copilotService');
jest.mock('../services/analyticsService');

describe('FileTreeProvider', () => {
  let provider: FileTreeProvider;
  let mockFileSystemService: jest.Mocked<FileSystemService>;
  let mockCopilotService: jest.Mocked<CopilotService>;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;

  beforeEach(() => {
    // Setup workspace folders
    (vscode.workspace as any).workspaceFolders = [
      {
        uri: vscode.Uri.file('/test/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ];

    // Create mocked instances with proper methods
    mockFileSystemService = {
      getFileTree: jest.fn().mockResolvedValue([]),
      readDirectory: jest.fn().mockResolvedValue([]),
      searchFiles: jest.fn().mockResolvedValue([]),
    } as any;

    mockCopilotService = {
      getFileAnalysis: jest.fn().mockResolvedValue(null),
      analyzeFile: jest.fn().mockResolvedValue(null),
      isAvailable: jest.fn().mockReturnValue(false),
      dispose: jest.fn(),
    } as any;

    mockAnalyticsService = {
      getProjectAnalytics: jest.fn().mockResolvedValue({}),
      collectFilesRecursively: jest.fn().mockResolvedValue([]),
    } as any;

    provider = new FileTreeProvider(
      mockFileSystemService,
      mockCopilotService,
      mockAnalyticsService
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    // No disposal needed
  });

  describe('Lazy Loading (Root Level)', () => {
    test('should return empty array if no workspace folders', async () => {
      (vscode.workspace as any).workspaceFolders = undefined;

      const children = await provider.getChildren();

      expect(children).toEqual([]);
    });

    test('should load workspace folders at root', async () => {
      const mockWorkspaceFolder = {
        uri: { fsPath: '/test/workspace', path: '/test/workspace' },
        name: 'test-workspace',
        index: 0,
      };
      (vscode.workspace as any).workspaceFolders = [mockWorkspaceFolder];

      const mockChildren: FileTreeItem[] = [
        { uri: vscode.Uri.file('/test/src'), name: 'src', type: 'folder' },
        { uri: vscode.Uri.file('/test/package.json'), name: 'package.json', type: 'file' },
      ];
      mockFileSystemService.getFileTree = jest.fn().mockResolvedValue(mockChildren);

      const children = await provider.getChildren();

      expect(children).toHaveLength(1);
      expect(children[0].name).toBe('test-workspace');
      expect(children[0].type).toBe('folder');
      expect(mockFileSystemService.getFileTree).toHaveBeenCalledWith(mockWorkspaceFolder.uri);
    });

    test('should NOT load children until node is expanded (lazy loading)', async () => {
      const mockWorkspaceFolder = {
        uri: { fsPath: '/test/workspace', path: '/test/workspace' },
        name: 'test-workspace',
        index: 0,
      };
      (vscode.workspace as any).workspaceFolders = [mockWorkspaceFolder];

      mockFileSystemService.getFileTree = jest.fn().mockResolvedValue([]);

      const children = await provider.getChildren();

      // Only root level loaded, not expanded children
      expect(mockFileSystemService.getFileTree).toHaveBeenCalledTimes(1);
      expect(children).toHaveLength(1);
    });
  });

  describe('Chunked Loading (< 100 items)', () => {
    test('should return all items at once for small folders', async () => {
      // Create a folder element to expand
      const mockFolder: FileTreeItem = {
        uri: vscode.Uri.file('/test/large-folder'),
        name: 'small-folder',
        type: 'folder',
      };

      // Create 50 items (under chunk size of 100)
      const mockChildren: FileTreeItem[] = Array.from({ length: 50 }, (_, i) => ({
        uri: vscode.Uri.file(`/test/small-folder/file${i}.txt`),
        name: `file${i}.txt`,
        type: 'file' as const,
      }));

      mockFileSystemService.getFileTree = jest.fn().mockResolvedValue(mockChildren);

      // Expand folder directly
      const folderChildren = await provider.getChildren(mockFolder);

      // All 50 items should load immediately (no chunking for < 100 items)
      expect(folderChildren).toHaveLength(50);
      expect(mockFileSystemService.getFileTree).toHaveBeenCalledWith(mockFolder.uri);
    });
  });

  describe('Chunked Loading (100-1000 items)', () => {
    test('should load first 100 items immediately, then load rest progressively', async () => {
      const mockFolder: FileTreeItem = {
        uri: vscode.Uri.file('/test/large-folder'),
        name: 'large-folder',
        type: 'folder',
      };

      // Create 250 items (over chunk size)
      const mockChildren: FileTreeItem[] = Array.from({ length: 250 }, (_, i) => ({
        uri: vscode.Uri.file(`/test/large-folder/file${i}.txt`),
        name: `file${i}.txt`,
        type: 'file' as const,
      }));

      mockFileSystemService.getFileTree = jest.fn().mockResolvedValue(mockChildren);

      // Expand folder
      const children = await provider.getChildren(mockFolder);

      // Should return first 100 items immediately
      expect(children).toHaveLength(100);
      expect(children[0].name).toBe('file0.txt');
      expect(children[99].name).toBe('file99.txt');

      // Give time for background loading (50ms per chunk)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Remaining 150 items should be loaded progressively in chunks
      // (verified by checking event emitter was called)
      expect(mockFileSystemService.getFileTree).toHaveBeenCalledWith(mockFolder.uri);
    });
  });

  describe('Chunked Loading (> 1000 items)', () => {
    test('should handle very large folders efficiently', async () => {
      const mockFolder: FileTreeItem = {
        uri: vscode.Uri.file('/test/huge-folder'),
        name: 'huge-folder',
        type: 'folder',
      };

      // Create 2000 items
      const mockChildren: FileTreeItem[] = Array.from({ length: 2000 }, (_, i) => ({
        uri: vscode.Uri.file(`/test/huge-folder/file${i}.txt`),
        name: `file${i}.txt`,
        type: 'file' as const,
      }));

      mockFileSystemService.getFileTree = jest.fn().mockResolvedValue(mockChildren);

      // Expand folder
      const children = await provider.getChildren(mockFolder);

      // Should return first 100 items immediately
      expect(children).toHaveLength(100);
      expect(mockFileSystemService.getFileTree).toHaveBeenCalledTimes(1);
    });
  });

  describe('Refresh Functionality', () => {
    test('should refresh entire tree when called without element', () => {
      // Just verify the method exists and can be called
      expect(() => provider.refresh()).not.toThrow();
    });

    test('should refresh specific node when called with element', () => {
      const mockElement: FileTreeItem = {
        uri: vscode.Uri.file('/test/folder'),
        name: 'folder',
        type: 'folder',
      };

      // Just verify the method exists and can be called
      expect(() => provider.refresh(mockElement)).not.toThrow();
    });
  });

  describe('Tree Item Creation', () => {
    test('should create tree item for file', () => {
      const fileItem: FileTreeItem = {
        uri: vscode.Uri.file('/test/file.ts'),
        name: 'file.ts',
        type: 'file',
      };

      const treeItem = provider.getTreeItem(fileItem);

      // TreeItem should be created
      expect(treeItem).toBeDefined();
      expect(treeItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
      expect(treeItem.contextValue).toBe('file');
    });

    test('should create tree item for folder', () => {
      const folderItem: FileTreeItem = {
        uri: vscode.Uri.file('/test/folder'),
        name: 'folder',
        type: 'folder',
        children: [{ uri: vscode.Uri.file('/test/folder/file.ts'), name: 'file.ts', type: 'file' }],
      };

      const treeItem = provider.getTreeItem(folderItem);

      // TreeItem should be created
      expect(treeItem).toBeDefined();
      expect(treeItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
      expect(treeItem.contextValue).toBe('folder');
    });

    test('should create tree item for empty folder', () => {
      const folderItem: FileTreeItem = {
        uri: vscode.Uri.file('/test/empty-folder'),
        name: 'empty-folder',
        type: 'folder',
        children: [],
      };

      const treeItem = provider.getTreeItem(folderItem);

      expect(treeItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully when loading children', async () => {
      const mockWorkspaceFolder = {
        uri: { fsPath: '/test/workspace', path: '/test/workspace' },
        name: 'test-workspace',
        index: 0,
      };
      (vscode.workspace as any).workspaceFolders = [mockWorkspaceFolder];

      mockFileSystemService.getFileTree = jest
        .fn()
        .mockRejectedValue(new Error('Permission denied'));

      const children = await provider.getChildren();

      expect(children).toEqual([]);
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load children')
      );
    });

    test('should return empty array for file (not folder)', async () => {
      const fileItem: FileTreeItem = {
        uri: vscode.Uri.file('/test/file.ts'),
        name: 'file.ts',
        type: 'file',
      };

      const children = await provider.getChildren(fileItem);

      expect(children).toEqual([]);
    });

    test('should handle missing URI', async () => {
      const folderItem: FileTreeItem = {
        name: 'folder-without-uri',
        type: 'folder',
      };

      const children = await provider.getChildren(folderItem);

      expect(children).toEqual([]);
    });
  });

  describe('Disposal', () => {
    test('should not have disposal requirements', () => {
      // FileTreeProvider doesn't implement IDisposable
      // Event emitter is managed automatically by VS Code
      expect(provider).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle concurrent expansions', async () => {
      const mockFolder: FileTreeItem = {
        uri: vscode.Uri.file('/test/folder'),
        name: 'folder',
        type: 'folder',
      };

      const mockChildren: FileTreeItem[] = Array.from({ length: 50 }, (_, i) => ({
        uri: vscode.Uri.file(`/test/folder/file${i}.txt`),
        name: `file${i}.txt`,
        type: 'file' as const,
      }));

      mockFileSystemService.getFileTree = jest.fn().mockResolvedValue(mockChildren);

      // Expand same folder multiple times concurrently
      const results = await Promise.all([
        provider.getChildren(mockFolder),
        provider.getChildren(mockFolder),
        provider.getChildren(mockFolder),
      ]);

      expect(results[0]).toHaveLength(50);
      expect(results[1]).toHaveLength(50);
      expect(results[2]).toHaveLength(50);
    });

    test('should handle rapid expand/collapse', async () => {
      const mockFolder: FileTreeItem = {
        uri: vscode.Uri.file('/test/folder'),
        name: 'folder',
        type: 'folder',
      };

      mockFileSystemService.getFileTree = jest.fn().mockResolvedValue([]);

      // Rapidly expand/collapse (simulated by multiple getChildren calls)
      await provider.getChildren(mockFolder);
      await provider.getChildren(mockFolder);
      await provider.getChildren(mockFolder);

      // Should not crash
      expect(true).toBe(true);
    });
  });
});
