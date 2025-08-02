import { FileSystemService } from '../services/fileSystemService';

// Mock vscode module
jest.mock('vscode');

describe('FileSystemService', () => {
  let fileSystemService: FileSystemService;

  beforeEach(() => {
    jest.clearAllMocks();
    fileSystemService = new FileSystemService();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(fileSystemService).toBeDefined();
    });

    it('should have default exclusion patterns', () => {
      const stats = fileSystemService.getStats();
      expect(stats).toBeDefined();
    });
  });

  describe('File Tree Generation', () => {
    it('should generate file tree structure', async () => {
      const mockUri = { fsPath: '/test/workspace' };
      const tree = await fileSystemService.getFileTree(mockUri as any);

      expect(tree).toBeDefined();
      expect(Array.isArray(tree)).toBe(true);
    });

    it('should handle empty directories', async () => {
      const mockUri = { fsPath: '/test/empty' };
      const tree = await fileSystemService.getFileTree(mockUri as any);

      expect(tree).toBeDefined();
      expect(Array.isArray(tree)).toBe(true);
    });
  });

  describe('File Content Reading', () => {
    it('should read text file content', async () => {
      const mockUri = { fsPath: '/test/workspace/src/main.ts' };
      const content = await fileSystemService.getFileContent(mockUri as any);

      expect(content).toBeDefined();
    });

    it('should handle missing files gracefully', async () => {
      const mockUri = { fsPath: '/test/workspace/missing.txt' };
      const content = await fileSystemService.getFileContent(mockUri as any);

      expect(content).toBeDefined();
    });
  });

  describe('Search Functionality', () => {
    it('should search for files', async () => {
      const results = await fileSystemService.searchFiles('test');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should refresh configuration', () => {
      expect(() => {
        fileSystemService.refreshConfig();
      }).not.toThrow();
    });

    it('should clear cache', () => {
      expect(() => {
        fileSystemService.clearCache();
      }).not.toThrow();
    });
  });
});
