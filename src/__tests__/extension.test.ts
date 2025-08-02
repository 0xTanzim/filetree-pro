import { AnalyticsService } from '../services/analyticsService';
import { CopilotService } from '../services/copilotService';
import { FileSystemService } from '../services/fileSystemService';

// Mock vscode module
jest.mock('vscode');

describe('FileTree Pro Extension', () => {
  let fileSystemService: FileSystemService;
  let copilotService: CopilotService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create service instances
    fileSystemService = new FileSystemService();
    copilotService = new CopilotService();
    analyticsService = new AnalyticsService();
  });

  describe('CopilotService', () => {
    it('should check Copilot availability', () => {
      const isAvailable = copilotService.isCopilotAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should return availability status', () => {
      const isAvailable = copilotService.isAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should handle Copilot analysis', async () => {
      const mockUri = { fsPath: '/test/file.ts' };
      const analysis = await copilotService.analyzeFile(mockUri as any);
      expect(analysis).toBeDefined();
    });
  });

  describe('FileSystemService', () => {
    it('should initialize with configuration', () => {
      expect(fileSystemService).toBeDefined();
    });

    it('should handle file tree generation', async () => {
      const mockUri = { fsPath: '/test/workspace' };
      const tree = await fileSystemService.getFileTree(mockUri as any);
      expect(Array.isArray(tree)).toBe(true);
    });
  });

  describe('AnalyticsService', () => {
    it('should initialize analytics', () => {
      expect(analyticsService).toBeDefined();
    });

    it('should get analytics data', async () => {
      const analytics = await analyticsService.getProjectAnalytics();
      expect(analytics).toBeDefined();
    });
  });
});
