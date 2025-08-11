import { shouldExclude } from '../commands/commands';

describe('✅ .gitignore Respect Feature', () => {
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
    expect(shouldExclude('node_modules', '/test-project/node_modules', mockRootPath)).toBe(true);
    expect(shouldExclude('dist', '/test-project/dist', mockRootPath)).toBe(true);
    expect(shouldExclude('app.log', '/test-project/app.log', mockRootPath)).toBe(true);
    expect(shouldExclude('temp-folder', '/test-project/temp-folder', mockRootPath)).toBe(true);
    expect(shouldExclude('secret.key', '/test-project/secret.key', mockRootPath)).toBe(true);

    // Test that non-gitignore files are not excluded (unless in default patterns)
    expect(shouldExclude('src', '/test-project/src', mockRootPath)).toBe(false);
    expect(shouldExclude('README.md', '/test-project/README.md', mockRootPath)).toBe(false);

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
      shouldExclude('node_modules', '/test-project-no-gitignore/node_modules', mockRootPath)
    ).toBe(true);
    expect(shouldExclude('.git', '/test-project-no-gitignore/.git', mockRootPath)).toBe(true);

    // Should not exclude regular files
    expect(shouldExclude('src', '/test-project-no-gitignore/src', mockRootPath)).toBe(false);
    expect(shouldExclude('README.md', '/test-project-no-gitignore/README.md', mockRootPath)).toBe(
      false
    );

    // Restore original function
    require('fs').existsSync = originalExistsSync;
  });
});
