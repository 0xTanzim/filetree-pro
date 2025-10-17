/**
 * Test Suite: TreeBuilderService
 * Tests file tree building logic with proper method signatures
 *
 * @author FileTree Pro Team
 * @since 0.3.0
 */

import * as vscode from 'vscode';
import { ExclusionService } from '../services/exclusionService';
import { TreeBuilderService } from '../services/treeBuilderService';

describe('TreeBuilderService', () => {
  let service: TreeBuilderService;
  let mockExclusionService: jest.Mocked<ExclusionService>;

  beforeEach(() => {
    // Create mock ExclusionService
    mockExclusionService = {
      shouldExclude: jest.fn().mockReturnValue(false),
      readGitignore: jest.fn().mockResolvedValue(['node_modules/', 'dist/', '*.log']),
      dispose: jest.fn(),
    } as any;

    // Create service instance
    service = new TreeBuilderService(mockExclusionService);

    // Reset VS Code mocks
    jest.clearAllMocks();

    // Setup default VS Code mocks
    (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
      ['src', vscode.FileType.Directory],
      ['package.json', vscode.FileType.File],
      ['README.md', vscode.FileType.File],
    ]);
  });

  describe('buildFileTreeItems', () => {
    test('should build tree items with correct parameters', async () => {
      const rootPath = '/test/project';
      const maxDepth = 10;
      const depth = 0;

      const items = await service.buildFileTreeItems(rootPath, maxDepth, rootPath, depth);

      expect(items).toHaveLength(3);
      expect(items[0].name).toBe('src');
      expect(items[0].type).toBe('folder');
      // Files are sorted alphabetically
      expect(items[1].name).toBe('README.md');
      expect(items[1].type).toBe('file');
      expect(items[2].name).toBe('package.json');
      expect(items[2].type).toBe('file');
    });

    test('should call readGitignore on first depth level', async () => {
      const rootPath = '/test/project';
      await service.buildFileTreeItems(rootPath, 10, rootPath, 0);

      expect(mockExclusionService.readGitignore).toHaveBeenCalledWith(rootPath);
      expect(mockExclusionService.readGitignore).toHaveBeenCalledTimes(1);
    });

    test('should not call readGitignore on deeper levels', async () => {
      const rootPath = '/test/project';
      await service.buildFileTreeItems(rootPath, 10, rootPath, 2); // depth = 2

      expect(mockExclusionService.readGitignore).not.toHaveBeenCalled();
    });

    test('should respect maxDepth limit', async () => {
      const rootPath = '/test/project';
      const maxDepth = 1;

      const items = await service.buildFileTreeItems(rootPath, maxDepth, rootPath, 2); // depth > maxDepth

      expect(items).toHaveLength(0);
      expect(vscode.workspace.fs.readDirectory).not.toHaveBeenCalled();
    });

    test('should exclude items based on exclusion service', async () => {
      mockExclusionService.shouldExclude.mockImplementation(
        (name: string) => name === 'node_modules'
      );

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['node_modules', vscode.FileType.Directory],
        ['src', vscode.FileType.Directory],
        ['package.json', vscode.FileType.File],
      ]);

      const items = await service.buildFileTreeItems('/test/project', 10, '/test/project', 0);

      // Should have 2 items (node_modules excluded)
      expect(items).toHaveLength(2);
      expect(items.find(item => item.name === 'node_modules')).toBeUndefined();
      expect(items.find(item => item.name === 'src')).toBeDefined();
    });

    test('should sort folders before files', async () => {
      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['zebra.txt', vscode.FileType.File],
        ['apple-folder', vscode.FileType.Directory],
        ['banana.txt', vscode.FileType.File],
        ['zebra-folder', vscode.FileType.Directory],
      ]);

      const items = await service.buildFileTreeItems('/test/project', 10, '/test/project', 0);

      // First two should be folders (alphabetically sorted)
      expect(items[0].type).toBe('folder');
      expect(items[0].name).toBe('apple-folder');
      expect(items[1].type).toBe('folder');
      expect(items[1].name).toBe('zebra-folder');

      // Next two should be files (alphabetically sorted)
      expect(items[2].type).toBe('file');
      expect(items[2].name).toBe('banana.txt');
      expect(items[3].type).toBe('file');
      expect(items[3].name).toBe('zebra.txt');
    });

    test('should handle progress callback', async () => {
      const progressCallback = jest.fn();
      await service.buildFileTreeItems('/test/project', 10, '/test/project', 0, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(expect.stringContaining('Building tree'));
    });

    test('should handle cancellation token', async () => {
      const mockToken = {
        isCancellationRequested: true,
        onCancellationRequested: jest.fn(),
      } as any;

      const items = await service.buildFileTreeItems(
        '/test/project',
        10,
        '/test/project',
        0,
        undefined,
        mockToken
      );

      expect(items).toHaveLength(0);
      expect(vscode.workspace.fs.readDirectory).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      (vscode.workspace.fs.readDirectory as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      const items = await service.buildFileTreeItems('/test/project', 10, '/test/project', 0);

      expect(items).toHaveLength(0); // Returns empty array on error
    });

    test('should build nested folder structure', async () => {
      // Setup nested structure
      (vscode.workspace.fs.readDirectory as jest.Mock)
        .mockResolvedValueOnce([
          ['src', vscode.FileType.Directory],
          ['package.json', vscode.FileType.File],
        ])
        .mockResolvedValueOnce([
          ['utils.ts', vscode.FileType.File],
          ['index.ts', vscode.FileType.File],
        ]);

      const items = await service.buildFileTreeItems('/test/project', 10, '/test/project', 0);

      expect(items).toHaveLength(2);
      expect(items[0].name).toBe('src');
      expect(items[0].children).toHaveLength(2);
      expect(items[0].children![0].name).toBe('index.ts');
      expect(items[0].children![1].name).toBe('utils.ts');
    });
  });

  describe('generateTreeLines', () => {
    test('should generate ASCII tree lines with correct parameters', async () => {
      const lines: string[] = [];
      const rootPath = '/test/project';
      const prefix = '';
      const depth = 0;
      const maxDepth = 10;
      const showIcons = true;

      await service.generateTreeLines(
        rootPath,
        prefix,
        lines,
        depth,
        maxDepth,
        showIcons,
        rootPath
      );

      expect(lines.length).toBeGreaterThan(0);
      expect(mockExclusionService.readGitignore).toHaveBeenCalledWith(rootPath);
    });

    test('should include icons when showIcons is true', async () => {
      const lines: string[] = [];
      await service.generateTreeLines('/test/project', '', lines, 0, 10, true, '/test/project');

      // Should have folder icon (📁) for folders
      const folderLines = lines.filter(line => line.includes('📁'));
      expect(folderLines.length).toBeGreaterThan(0);
    });

    test('should exclude icons when showIcons is false', async () => {
      const lines: string[] = [];
      await service.generateTreeLines('/test/project', '', lines, 0, 10, false, '/test/project');

      // Should NOT have folder icon for folders
      const folderLines = lines.filter(line => line.includes('📁'));
      expect(folderLines.length).toBe(0);
    });

    test('should use correct tree connectors', async () => {
      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file1.txt', vscode.FileType.File],
        ['file2.txt', vscode.FileType.File],
      ]);

      const lines: string[] = [];
      await service.generateTreeLines('/test/project', '', lines, 0, 10, false, '/test/project');

      // First item should use ├──, last should use └──
      expect(lines[0]).toContain('├──');
      expect(lines[lines.length - 1]).toContain('└──');
    });

    test('should respect maxDepth in tree lines', async () => {
      const lines: string[] = [];
      await service.generateTreeLines('/test/project', '', lines, 5, 3, true, '/test/project');

      // Should not process anything because depth (5) > maxDepth (3)
      expect(lines).toHaveLength(0);
    });

    test('should handle progress callback in tree lines', async () => {
      const progressCallback = jest.fn();
      const lines: string[] = [];

      await service.generateTreeLines(
        '/test/project',
        '',
        lines,
        0,
        10,
        true,
        '/test/project',
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalledWith(expect.stringContaining('Reading directory'));
    });

    test('should handle cancellation in tree lines', async () => {
      const mockToken = {
        isCancellationRequested: true,
        onCancellationRequested: jest.fn(),
      } as any;

      const lines: string[] = [];
      await service.generateTreeLines(
        '/test/project',
        '',
        lines,
        0,
        10,
        true,
        '/test/project',
        undefined,
        mockToken
      );

      expect(lines).toHaveLength(0);
      expect(vscode.workspace.fs.readDirectory).not.toHaveBeenCalled();
    });

    test('should handle errors in tree lines', async () => {
      (vscode.workspace.fs.readDirectory as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      const lines: string[] = [];
      await service.generateTreeLines('/test/project', '', lines, 0, 10, true, '/test/project');

      // Should add error line
      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0]).toContain('Error reading directory');
    });

    test('should process large directories in batches', async () => {
      // Create a large array of items (> 100 items to trigger batching)
      const largeArray = Array.from({ length: 150 }, (_, i) => [
        `file${i}.txt`,
        vscode.FileType.File,
      ]);
      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue(largeArray);

      const progressCallback = jest.fn();
      const lines: string[] = [];

      await service.generateTreeLines(
        '/test/project',
        '',
        lines,
        0,
        10,
        true,
        '/test/project',
        progressCallback
      );

      // Should have processed all items
      expect(lines.length).toBe(150);

      // Progress callback should have been called for batch progress
      expect(progressCallback).toHaveBeenCalled();
    });

    test('should exclude items in tree lines', async () => {
      mockExclusionService.shouldExclude.mockImplementation(
        (name: string) => name === 'secret.txt'
      );

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['public.txt', vscode.FileType.File],
        ['secret.txt', vscode.FileType.File],
      ]);

      const lines: string[] = [];
      await service.generateTreeLines('/test/project', '', lines, 0, 10, false, '/test/project');

      // Should only have 1 line (secret.txt excluded)
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('public.txt');
      expect(lines.find(line => line.includes('secret.txt'))).toBeUndefined();
    });
  });
});
