import * as vscode from 'vscode';
import { ExclusionService } from '../services/exclusionService';

describe('✅ .gitignore Respect Feature', () => {
  let exclusionService: ExclusionService;

  beforeEach(() => {
    exclusionService = new ExclusionService();
  });

  afterEach(() => {
    exclusionService.clearCache();
  });

  test('should respect .gitignore patterns when enabled', async () => {
    // Create a mock .gitignore file path
    const mockRootPath = '/test-project';

    // Mock vscode.workspace.fs.readFile to simulate .gitignore file
    const mockContent = Buffer.from(`# Test .gitignore
node_modules/
dist/
*.log
temp-folder/
secret.key`);

    (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(mockContent);

    // Pre-load gitignore patterns (CRITICAL!)
    await exclusionService.readGitignore(mockRootPath);

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
  });

  test('should work without .gitignore file', async () => {
    const mockRootPath = '/test-project-no-gitignore';

    // Mock vscode.workspace.fs.readFile to throw (no .gitignore)
    (vscode.workspace.fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

    // Attempt to read gitignore (will return empty array)
    await exclusionService.readGitignore(mockRootPath);

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
  });
});
