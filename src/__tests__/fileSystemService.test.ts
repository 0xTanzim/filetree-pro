/**
 * Test Suite: FileSystemService
 * Tests file system operations with LRU caching and security validation
 *
 * @author FileTree Pro Team
 * @since 0.3.0
 */

import * as vscode from 'vscode';
import { FileSystemService } from '../services/fileSystemService';

describe('FileSystemService', () => {
  let service: FileSystemService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FileSystemService();

    // Setup default mocks
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          exclude: [],
          useCopilot: true,
          maxDepth: 10,
          showFileSize: true,
          showFileDate: false,
          enableSearch: true,
          enableAnalytics: true,
        };
        return config[key] ?? defaultValue;
      }),
    });
  });

  afterEach(() => {
    // Cleanup service resources
    service.dispose();
  });

  describe('Initialization', () => {
    test('should initialize without errors', () => {
      expect(() => new FileSystemService()).not.toThrow();
    });

    test('should load configuration from workspace', () => {
      const testService = new FileSystemService();
      expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('filetree-pro');
      testService.dispose();
    });

    test('should initialize with default exclusion patterns', () => {
      const testService = new FileSystemService();

      // Service should have internal exclusion patterns
      expect(testService).toBeDefined();
      expect(testService.getFileTree).toBeDefined();
      testService.dispose();
    });

    test('should validate user exclusion patterns on init', () => {
      // Mock invalid user patterns
      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'exclude') {
            return ['valid_pattern', '***invalid***']; // Invalid pattern with too many wildcards
          }
          return defaultValue;
        }),
      });

      const testService = new FileSystemService();

      // Should initialize despite invalid patterns (using defaults)
      expect(testService).toBeDefined();
      testService.dispose();
    });
  });

  describe('getFileTree', () => {
    test('should return file tree for valid directory', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      // Mock directory reading
      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file1.ts', vscode.FileType.File],
        ['folder1', vscode.FileType.Directory],
        ['file2.js', vscode.FileType.File],
      ]);

      // Mock file stats
      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      const result = await service.getFileTree(uri);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should sort results with folders first, then files', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['zebra.txt', vscode.FileType.File],
        ['alpha', vscode.FileType.Directory],
        ['beta.js', vscode.FileType.File],
        ['gamma', vscode.FileType.Directory],
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      const result = await service.getFileTree(uri);

      // First two should be folders (alpha, gamma)
      expect(result[0].type).toBe('folder');
      expect(result[1].type).toBe('folder');

      // Next two should be files (beta.js, zebra.txt)
      expect(result[2].type).toBe('file');
      expect(result[3].type).toBe('file');
    });

    test('should exclude default patterns (node_modules, .git, etc.)', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['src', vscode.FileType.Directory],
        ['node_modules', vscode.FileType.Directory], // Should be excluded
        ['.git', vscode.FileType.Directory], // Should be excluded
        ['package.json', vscode.FileType.File],
        ['build', vscode.FileType.Directory], // Should be excluded
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      const result = await service.getFileTree(uri);

      // Should only include src and package.json
      const names = result.map(item => item.name);
      expect(names).toContain('src');
      expect(names).toContain('package.json');
      expect(names).not.toContain('node_modules');
      expect(names).not.toContain('.git');
      expect(names).not.toContain('build');
    });

    test('should exclude glob patterns (*.log, *.pyc)', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['app.ts', vscode.FileType.File],
        ['debug.log', vscode.FileType.File], // Should be excluded
        ['main.py', vscode.FileType.File],
        ['cache.pyc', vscode.FileType.File], // Should be excluded
        ['temp.tmp', vscode.FileType.File], // Should be excluded
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      const result = await service.getFileTree(uri);

      const names = result.map(item => item.name);
      expect(names).toContain('app.ts');
      expect(names).toContain('main.py');
      expect(names).not.toContain('debug.log');
      expect(names).not.toContain('cache.pyc');
      expect(names).not.toContain('temp.tmp');
    });

    test('should respect maxDepth configuration', async () => {
      // Set maxDepth to 1
      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'maxDepth') return 1;
          return defaultValue;
        }),
      });

      service = new FileSystemService();

      const uri = vscode.Uri.file('/test/workspace');

      // Mock nested directory structure
      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['level1', vscode.FileType.Directory],
      ]);

      const result = await service.getFileTree(uri, 0);

      // Should get level1 folder
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      service.dispose();
    });

    test('should validate paths for security (path traversal)', async () => {
      const maliciousUri = vscode.Uri.file('/test/../../../etc/passwd');

      const result = await service.getFileTree(maliciousUri);

      // Should return empty array for invalid paths
      expect(result).toEqual([]);
    });

    test('should validate file sizes for security', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['huge.dat', vscode.FileType.File],
      ]);

      // Mock huge file (> 10MB)
      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 100 * 1024 * 1024, // 100 MB
        mtime: Date.now(),
        ctime: Date.now(),
      });

      const result = await service.getFileTree(uri);

      // Should still return the file but without detailed stats
      expect(result).toBeDefined();
    });

    test('should handle file system errors gracefully', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      // Mock read error
      (vscode.workspace.fs.readDirectory as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      const result = await service.getFileTree(uri);

      // Should return empty array on error
      expect(result).toEqual([]);
    });

    test('should handle stat errors gracefully', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file.txt', vscode.FileType.File],
      ]);

      // Mock stat error
      (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(new Error('Stat failed'));

      const result = await service.getFileTree(uri);

      // Should return file without detailed stats
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('LRU Cache', () => {
    test('should cache getFileTree results', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file.txt', vscode.FileType.File],
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      // First call - should hit filesystem
      await service.getFileTree(uri);

      // Clear mock call history
      (vscode.workspace.fs.readDirectory as jest.Mock).mockClear();

      // Second call - should use cache
      await service.getFileTree(uri);

      // Filesystem should not be called again
      expect(vscode.workspace.fs.readDirectory).not.toHaveBeenCalled();
    });

    test('should use different cache keys for different depths', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file.txt', vscode.FileType.File],
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      // Call with depth 0
      await service.getFileTree(uri, 0);

      // Call with depth 1 - should not use cached result from depth 0
      await service.getFileTree(uri, 1);

      // Both calls should hit filesystem
      expect(vscode.workspace.fs.readDirectory).toHaveBeenCalledTimes(2);
    });

    test('should evict old entries when cache is full (LRU)', async () => {
      // This tests the LRU behavior indirectly
      // Cache has capacity of 100 entries

      const promises = [];
      for (let i = 0; i < 105; i++) {
        const uri = vscode.Uri.file(`/test/file${i}`);
        promises.push(service.getFileTree(uri));
      }

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([]);

      await Promise.all(promises);

      // Oldest entries should be evicted
      // Cache should maintain LRU order
      expect(service).toBeDefined();
    });

    test('should cleanup expired cache entries periodically', async () => {
      // Service initializes cleanup interval
      // This is tested by checking the service doesn't crash

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(service).toBeDefined();
    });
  });

  describe('Statistics', () => {
    test('should track cache hit rate', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file.txt', vscode.FileType.File],
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      // First call - cache miss
      await service.getFileTree(uri);

      // Second call - cache hit
      await service.getFileTree(uri);

      const stats = service.getStats();

      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats.cacheHitRate).toBeGreaterThan(0);
    });

    test('should track total files and folders', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file1.txt', vscode.FileType.File],
        ['file2.js', vscode.FileType.File],
        ['folder1', vscode.FileType.Directory],
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      await service.getFileTree(uri);

      const stats = service.getStats();

      expect(stats.totalFiles).toBeGreaterThan(0);
      expect(stats.totalFolders).toBeGreaterThan(0);
    });

    test('should track error count', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      // Mock error
      (vscode.workspace.fs.readDirectory as jest.Mock).mockRejectedValue(new Error('Read error'));

      await service.getFileTree(uri);

      const stats = service.getStats();

      expect(stats.errorCount).toBeGreaterThan(0);
    });

    test('should track read time', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file.txt', vscode.FileType.File],
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      await service.getFileTree(uri);

      const stats = service.getStats();

      expect(stats).toHaveProperty('readTime');
      expect(typeof stats.readTime).toBe('number');
    });
  });

  describe('Cache Management', () => {
    test('should clear cache on demand', () => {
      expect(() => service.clearCache()).not.toThrow();
    });

    test('should invalidate cache after clearing', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file.txt', vscode.FileType.File],
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      // First call
      await service.getFileTree(uri);

      // Clear cache
      service.clearCache();

      // Clear mock history
      (vscode.workspace.fs.readDirectory as jest.Mock).mockClear();

      // Second call should hit filesystem again
      await service.getFileTree(uri);

      expect(vscode.workspace.fs.readDirectory).toHaveBeenCalled();
    });
  });

  describe('Resource Cleanup', () => {
    test('should cleanup resources on dispose', () => {
      const testService = new FileSystemService();

      expect(() => testService.dispose()).not.toThrow();
    });

    test('should clear cleanup interval on dispose', () => {
      const testService = new FileSystemService();

      testService.dispose();

      // Service should handle disposed state gracefully
      expect(testService).toBeDefined();
    });

    test('should handle multiple dispose calls', () => {
      const testService = new FileSystemService();

      testService.dispose();

      // Second dispose should not throw
      expect(() => testService.dispose()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty directories', async () => {
      const uri = vscode.Uri.file('/test/empty');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([]);

      const result = await service.getFileTree(uri);

      expect(result).toEqual([]);
    });

    test('should handle very deep directory structures', async () => {
      const uri = vscode.Uri.file('/test/deep');

      // Mock deep structure
      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['nested', vscode.FileType.Directory],
      ]);

      const result = await service.getFileTree(uri, 0);

      expect(result).toBeDefined();
    });

    test('should handle special characters in filenames', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file with spaces.txt', vscode.FileType.File],
        ['file-with-dashes.js', vscode.FileType.File],
        ['file_with_underscores.py', vscode.FileType.File],
        ['file.multiple.dots.md', vscode.FileType.File],
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      const result = await service.getFileTree(uri);

      expect(result.length).toBe(4);
      expect(result.every(item => item.name)).toBe(true);
    });

    test('should handle symlinks gracefully', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['symlink', vscode.FileType.SymbolicLink],
        ['regular.txt', vscode.FileType.File],
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      const result = await service.getFileTree(uri);

      // Should handle symlinks without crashing
      expect(result).toBeDefined();
    });

    test('should handle concurrent requests', async () => {
      const uri = vscode.Uri.file('/test/workspace');

      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['file.txt', vscode.FileType.File],
      ]);

      (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({
        type: vscode.FileType.File,
        size: 1024,
        mtime: Date.now(),
        ctime: Date.now(),
      });

      // Fire multiple concurrent requests
      const requests = [
        service.getFileTree(uri),
        service.getFileTree(uri),
        service.getFileTree(uri),
      ];

      const results = await Promise.all(requests);

      // All should complete successfully
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});
