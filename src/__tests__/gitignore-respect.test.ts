import { ExclusionService } from '../services/exclusionService';

describe('✅ .gitignore Respect Feature', () => {
  let exclusionService: ExclusionService;

  beforeEach(() => {
    exclusionService = new ExclusionService();
  });

  afterEach(() => {
    exclusionService.clearCache();
  });

  test('should respect .gitignore patterns when enabled', () => {
    // Create a mock .gitignore file path
    const mockRootPath = '/test-project';

    // Mock fs.existsSync and fs.readFileSync to simulate .gitignore file
    const originalExistsSync = require('fs').existsSync;
    const originalReadFileSync = require('fs').readFileSync;

    require('fs').existsSync = jest.fn((path: string) => {
      return path.includes('.gitignore');
    });

    require('fs').readFileSync = jest.fn(() => {
      return `# Test .gitignore
node_modules/
dist/
*.log
temp-folder/
secret.key`;
    });

    // Test that gitignore patterns are respected
    expect(
      exclusionService.shouldExclude('node_modules', '/test-project/node_modules', mockRootPath)
    ).toBe(true);
    expect(exclusionService.shouldExclude('dist', '/test-project/dist', mockRootPath)).toBe(true);
    expect(exclusionService.shouldExclude('app.log', '/test-project/app.log', mockRootPath)).toBe(
      true
    );
    expect(
      exclusionService.shouldExclude('temp-folder', '/test-project/temp-folder', mockRootPath)
    ).toBe(true);
    expect(
      exclusionService.shouldExclude('secret.key', '/test-project/secret.key', mockRootPath)
    ).toBe(true);

    // Test that non-gitignore files are not excluded (unless in default patterns)
    expect(exclusionService.shouldExclude('src', '/test-project/src', mockRootPath)).toBe(false);
    expect(
      exclusionService.shouldExclude('README.md', '/test-project/README.md', mockRootPath)
    ).toBe(false);

    // Restore original functions
    require('fs').existsSync = originalExistsSync;
    require('fs').readFileSync = originalReadFileSync;
  });

  test('should work without .gitignore file', () => {
    const mockRootPath = '/test-project-no-gitignore';

    // Mock fs.existsSync to return false (no .gitignore)
    const originalExistsSync = require('fs').existsSync;
    require('fs').existsSync = jest.fn(() => false);

    // Should still exclude default patterns
    expect(
      exclusionService.shouldExclude(
        'node_modules',
        '/test-project-no-gitignore/node_modules',
        mockRootPath
      )
    ).toBe(true);
    expect(
      exclusionService.shouldExclude('.git', '/test-project-no-gitignore/.git', mockRootPath)
    ).toBe(true);

    // Should not exclude regular files
    expect(
      exclusionService.shouldExclude('src', '/test-project-no-gitignore/src', mockRootPath)
    ).toBe(false);
    expect(
      exclusionService.shouldExclude(
        'README.md',
        '/test-project-no-gitignore/README.md',
        mockRootPath
      )
    ).toBe(false);

    // Restore original function
    require('fs').existsSync = originalExistsSync;
  });
});
