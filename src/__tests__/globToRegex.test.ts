import * as vscode from 'vscode';
import { ExclusionService } from '../services/exclusionService';

describe('🔍 globToRegex Pattern Matching', () => {
  let exclusionService: ExclusionService;

  beforeEach(() => {
    exclusionService = new ExclusionService();
  });

  afterEach(() => {
    exclusionService.clearCache();
  });

  describe('Directory patterns ending with /', () => {
    test('should match directory names correctly', async () => {
      // Mock .gitignore with directory patterns
      const mockRootPath = '/test-project';

      const mockContent = Buffer.from(`temp-folder/
build-output/
cache-dir/`);

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      // Pre-load gitignore patterns
      await exclusionService.readGitignore(mockRootPath);

      // Test directory patterns
      expect(
        exclusionService.shouldExclude('temp-folder', '/test-project/temp-folder', mockRootPath)
      ).toBe(true);
      expect(
        exclusionService.shouldExclude('build-output', '/test-project/build-output', mockRootPath)
      ).toBe(true);
      expect(
        exclusionService.shouldExclude('cache-dir', '/test-project/cache-dir', mockRootPath)
      ).toBe(true);

      // Test nested directory patterns
      expect(
        exclusionService.shouldExclude('temp-folder', '/test-project/src/temp-folder', mockRootPath)
      ).toBe(true);
      expect(
        exclusionService.shouldExclude(
          'build-output',
          '/test-project/some/build-output',
          mockRootPath
        )
      ).toBe(true);
    });
  });

  describe('Exact name patterns', () => {
    test('should not match files with pattern names as substrings', async () => {
      const mockRootPath = '/test-project';

      const mockContent = Buffer.from(`checkout
layout
temp`);

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      // Pre-load gitignore patterns
      await exclusionService.readGitignore(mockRootPath);

      // These should NOT be excluded (files containing pattern names)
      expect(
        exclusionService.shouldExclude(
          'CheckoutBanner.tsx',
          '/test-project/CheckoutBanner.tsx',
          mockRootPath
        )
      ).toBe(false);
      expect(
        exclusionService.shouldExclude(
          'LayoutComponent.tsx',
          '/test-project/LayoutComponent.tsx',
          mockRootPath
        )
      ).toBe(false);
      expect(
        exclusionService.shouldExclude('template.js', '/test-project/template.js', mockRootPath)
      ).toBe(false);

      // These SHOULD be excluded (exact matches)
      expect(
        exclusionService.shouldExclude('checkout', '/test-project/checkout', mockRootPath)
      ).toBe(true);
      expect(exclusionService.shouldExclude('layout', '/test-project/layout', mockRootPath)).toBe(
        true
      );
      expect(exclusionService.shouldExclude('temp', '/test-project/temp', mockRootPath)).toBe(true);
    });
  });

  describe('File extension patterns', () => {
    test('should handle *.ext patterns correctly', () => {
      const mockRootPath = '/test-project';

      const originalExistsSync = require('fs').existsSync;
      const originalReadFileSync = require('fs').readFileSync;

      require('fs').existsSync = jest.fn((path: string) => {
        return path.includes('.gitignore');
      });

      require('fs').readFileSync = jest.fn(() => {
        return `*.log
*.tmp
*.cache`;
      });

      // These should be excluded
      expect(exclusionService.shouldExclude('app.log', '/test-project/app.log', mockRootPath)).toBe(
        true
      );
      expect(
        exclusionService.shouldExclude('build.tmp', '/test-project/build.tmp', mockRootPath)
      ).toBe(true);
      expect(
        exclusionService.shouldExclude('data.cache', '/test-project/data.cache', mockRootPath)
      ).toBe(true);

      // These should not be excluded
      expect(exclusionService.shouldExclude('app.js', '/test-project/app.js', mockRootPath)).toBe(
        false
      );
      expect(
        exclusionService.shouldExclude('login.tsx', '/test-project/login.tsx', mockRootPath)
      ).toBe(false);

      // Restore original functions
      require('fs').existsSync = originalExistsSync;
      require('fs').readFileSync = originalReadFileSync;
    });
  });
});
