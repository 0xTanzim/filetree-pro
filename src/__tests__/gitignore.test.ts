import * as vscode from 'vscode';

jest.mock('vscode', () => ({
  workspace: {
    fs: {
      readFile: jest.fn(),
      stat: jest.fn(),
      readDirectory: jest.fn(),
    },
    getConfiguration: jest.fn(() => ({
      get: jest.fn(() => []),
    })),
  },
  window: {
    showQuickPick: jest.fn(),
    showInputBox: jest.fn(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
  },
  Uri: {
    file: jest.fn(path => ({ fsPath: path })),
  },
  FileType: {
    File: 1,
    Directory: 2,
  },
}));

describe('📁 .gitignore Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readGitignore Function', () => {
    it('should read .gitignore file and parse patterns correctly', async () => {
      const mockGitignoreContent = `
# Dependencies
node_modules/
dist/
build/

# Logs
*.log
npm-debug.log*

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(mockGitignoreContent)
      );

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toEqual([
        'node_modules/',
        'dist/',
        'build/',
        '*.log',
        'npm-debug.log*',
        '.env',
        '.env.local',
        '.vscode/',
        '.idea/',
      ]);
    });

    it('should handle missing .gitignore file gracefully', async () => {
      (vscode.workspace.fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toEqual([]);
    });

    it('should filter out comments and empty lines', async () => {
      const mockGitignoreContent = `
# This is a comment
node_modules/
# Another comment

dist/
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(mockGitignoreContent)
      );

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toEqual(['node_modules/', 'dist/']);
    });

    it('should handle empty .gitignore file', async () => {
      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(Buffer.from(''));

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toEqual([]);
    });

    it('should handle .gitignore with only comments', async () => {
      const mockGitignoreContent = `
# This is a comment
# Another comment
# No actual patterns
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(mockGitignoreContent)
      );

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toEqual([]);
    });

    it('should handle .gitignore with mixed content', async () => {
      const mockGitignoreContent = `
# Dependencies
node_modules/
dist/

# Logs
*.log

# Keep this file
!important.log
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(mockGitignoreContent)
      );

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toEqual(['node_modules/', 'dist/', '*.log', '!important.log']);
    });
  });

  describe('Integration with shouldExclude', () => {
    it('should combine .gitignore patterns with default exclusions', async () => {
      const mockGitignoreContent = `
node_modules/
dist/
*.log
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(mockGitignoreContent)
      );

      // Mock user configuration
      const mockConfig = {
        get: jest.fn(() => ['.env', '*.tmp']),
      };

      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);

      const { shouldExclude } = await import('../commands/commands');

      // Test that both .gitignore and default exclusions are respected
      expect(shouldExclude('node_modules')).toBe(true);
      expect(shouldExclude('dist')).toBe(true);
      expect(shouldExclude('.env')).toBe(true);
      expect(shouldExclude('temp.tmp')).toBe(true);
      expect(shouldExclude('src')).toBe(false);
    });

    it('should handle case-insensitive matching', async () => {
      const mockGitignoreContent = `
NODE_MODULES/
DIST/
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(mockGitignoreContent)
      );

      const { shouldExclude } = await import('../commands/commands');

      expect(shouldExclude('node_modules')).toBe(true);
      expect(shouldExclude('NODE_MODULES')).toBe(true);
      expect(shouldExclude('dist')).toBe(true);
      expect(shouldExclude('DIST')).toBe(true);
    });

    it('should handle wildcard patterns', async () => {
      const mockGitignoreContent = `
*.log
*.tmp
*.cache
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(mockGitignoreContent)
      );

      const { shouldExclude } = await import('../commands/commands');

      expect(shouldExclude('app.log')).toBe(true);
      expect(shouldExclude('temp.tmp')).toBe(true);
      expect(shouldExclude('cache.cache')).toBe(true);
      expect(shouldExclude('important.txt')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle .gitignore with special characters', async () => {
      const mockGitignoreContent = `
# Files with spaces
my file.txt
my folder/

# Files with dots
.config
.env.local
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(mockGitignoreContent)
      );

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toEqual(['my file.txt', 'my folder/', '.config', '.env.local']);
    });

    it('should handle .gitignore with leading/trailing whitespace', async () => {
      const mockGitignoreContent = `
  node_modules/
  dist/
  *.log
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(mockGitignoreContent)
      );

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toEqual(['node_modules/', 'dist/', '*.log']);
    });

    it('should handle file system errors gracefully', async () => {
      (vscode.workspace.fs.readFile as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      (vscode.workspace.fs.readFile as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toEqual([]);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large .gitignore files efficiently', async () => {
      const largeGitignoreContent = Array.from({ length: 1000 }, (_, i) => `file${i}.txt`).join(
        '\n'
      );

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(largeGitignoreContent)
      );

      const { readGitignore } = await import('../commands/commands');

      const startTime = Date.now();
      const patterns = await readGitignore('/test/path');
      const endTime = Date.now();

      expect(patterns).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle multiple concurrent reads', async () => {
      const mockGitignoreContent = 'node_modules/\ndist/\n*.log';

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(mockGitignoreContent)
      );

      const { readGitignore } = await import('../commands/commands');

      const promises = Array.from({ length: 10 }, () => readGitignore('/test/path'));
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toEqual(['node_modules/', 'dist/', '*.log']);
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical Node.js .gitignore', async () => {
      const typicalNodeGitignore = `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(typicalNodeGitignore)
      );

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toContain('node_modules/');
      expect(patterns).toContain('npm-debug.log*');
      expect(patterns).toContain('coverage/');
      expect(patterns).toContain('.env');
      expect(patterns.length).toBeGreaterThan(10);
    });

    it('should handle typical Python .gitignore', async () => {
      const typicalPythonGitignore = `
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# PyInstaller
*.manifest
*.spec

# Unit test / coverage reports
htmlcov/
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/
.pytest_cache/

# Virtual environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/
      `.trim();

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from(typicalPythonGitignore)
      );

      const { readGitignore } = await import('../commands/commands');

      const patterns = await readGitignore('/test/path');

      expect(patterns).toContain('__pycache__/');
      expect(patterns).toContain('*.py[cod]');
      expect(patterns).toContain('build/');
      expect(patterns).toContain('.env');
      expect(patterns).toContain('venv/');
      expect(patterns.length).toBeGreaterThan(15);
    });
  });
});
