import { shouldExclude } from '../commands/commands';

describe('🔍 globToRegex Pattern Matching', () => {
  describe('Directory patterns ending with /', () => {
    test('should match directory names correctly', () => {
      // Mock .gitignore with directory patterns
      const mockRootPath = '/test-project';

      const originalExistsSync = require('fs').existsSync;
      const originalReadFileSync = require('fs').readFileSync;

      require('fs').existsSync = jest.fn((path: string) => {
        return path.includes('.gitignore');
      });

      require('fs').readFileSync = jest.fn(() => {
        return `temp-folder/
build-output/
cache-dir/`;
      });

      // Test directory patterns
      expect(shouldExclude('temp-folder', '/test-project/temp-folder', mockRootPath)).toBe(true);
      expect(shouldExclude('build-output', '/test-project/build-output', mockRootPath)).toBe(true);
      expect(shouldExclude('cache-dir', '/test-project/cache-dir', mockRootPath)).toBe(true);

      // Test nested directory patterns
      expect(shouldExclude('temp-folder', '/test-project/src/temp-folder', mockRootPath)).toBe(
        true
      );
      expect(shouldExclude('build-output', '/test-project/some/build-output', mockRootPath)).toBe(
        true
      );

      // Restore original functions
      require('fs').existsSync = originalExistsSync;
      require('fs').readFileSync = originalReadFileSync;
    });
  });

  describe('Exact name patterns', () => {
    test('should not match files with pattern names as substrings', () => {
      const mockRootPath = '/test-project';

      const originalExistsSync = require('fs').existsSync;
      const originalReadFileSync = require('fs').readFileSync;

      require('fs').existsSync = jest.fn((path: string) => {
        return path.includes('.gitignore');
      });

      require('fs').readFileSync = jest.fn(() => {
        return `checkout
layout
temp`;
      });

      // These should NOT be excluded (files containing pattern names)
      expect(
        shouldExclude('CheckoutBanner.tsx', '/test-project/CheckoutBanner.tsx', mockRootPath)
      ).toBe(false);
      expect(
        shouldExclude('LayoutComponent.tsx', '/test-project/LayoutComponent.tsx', mockRootPath)
      ).toBe(false);
      expect(shouldExclude('template.js', '/test-project/template.js', mockRootPath)).toBe(false);

      // These SHOULD be excluded (exact matches)
      expect(shouldExclude('checkout', '/test-project/checkout', mockRootPath)).toBe(true);
      expect(shouldExclude('layout', '/test-project/layout', mockRootPath)).toBe(true);
      expect(shouldExclude('temp', '/test-project/temp', mockRootPath)).toBe(true);

      // Restore original functions
      require('fs').existsSync = originalExistsSync;
      require('fs').readFileSync = originalReadFileSync;
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
      expect(shouldExclude('app.log', '/test-project/app.log', mockRootPath)).toBe(true);
      expect(shouldExclude('build.tmp', '/test-project/build.tmp', mockRootPath)).toBe(true);
      expect(shouldExclude('data.cache', '/test-project/data.cache', mockRootPath)).toBe(true);

      // These should not be excluded
      expect(shouldExclude('app.js', '/test-project/app.js', mockRootPath)).toBe(false);
      expect(shouldExclude('login.tsx', '/test-project/login.tsx', mockRootPath)).toBe(false);

      // Restore original functions
      require('fs').existsSync = originalExistsSync;
      require('fs').readFileSync = originalReadFileSync;
    });
  });
});
