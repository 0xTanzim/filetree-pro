import * as vscode from 'vscode';
import { buildTreeData, shouldExclude } from '../commands/commands';

jest.mock('vscode', () => ({
  workspace: {
    fs: {
      readDirectory: jest.fn(),
    },
    getConfiguration: jest.fn(() => ({
      get: jest.fn(() => []),
    })),
  },
  FileType: {
    Directory: 1,
    File: 2,
  },
  Uri: {
    file: (path: string) => ({ fsPath: path }),
  },
}));

describe('📁 Exclusion Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JSON and SVG Format Exclusions', () => {
    it('should exclude node_modules in buildTreeData', async () => {
      // Mock directory structure with node_modules
      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['src', vscode.FileType.Directory],
        ['node_modules', vscode.FileType.Directory],
        ['package.json', vscode.FileType.File],
        ['README.md', vscode.FileType.File],
      ]);

      try {
        const result = await buildTreeData('/test', 10, true, 0);
        console.log('Result length:', result.length);
        console.log('Result:', JSON.stringify(result, null, 2));

        // Should not include node_modules
        const nodeModulesNode = result.find((node: any) => node.name === 'node_modules');
        console.log('node_modules found:', nodeModulesNode);
        expect(nodeModulesNode).toBeUndefined();

        // Should include other files
        const packageJsonNode = result.find((node: any) => node.name === 'package.json');
        console.log('package.json found:', packageJsonNode);
        expect(packageJsonNode).toBeDefined();
        expect(packageJsonNode.type).toBe('file');
      } catch (error) {
        console.error('Error in test:', error);
        throw error;
      }
    });

    it('should exclude .git folder in buildTreeData', async () => {
      // Mock directory structure with .git
      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['src', vscode.FileType.Directory],
        ['.git', vscode.FileType.Directory],
        ['main.js', vscode.FileType.File],
      ]);

      const result = await buildTreeData('/test', 10, true, 0);

      // Should not include .git
      const gitNode = result.find((node: any) => node.name === '.git');
      expect(gitNode).toBeUndefined();

      // Should include other files
      const mainJsNode = result.find((node: any) => node.name === 'main.js');
      expect(mainJsNode).toBeDefined();
    });

    it('should exclude dist folder in buildTreeData', async () => {
      // Mock directory structure with dist
      (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
        ['src', vscode.FileType.Directory],
        ['dist', vscode.FileType.Directory],
        ['index.html', vscode.FileType.File],
      ]);

      const result = await buildTreeData('/test', 10, true, 0);

      // Should not include dist
      const distNode = result.find((node: any) => node.name === 'dist');
      expect(distNode).toBeUndefined();

      // Should include other files
      const indexHtmlNode = result.find((node: any) => node.name === 'index.html');
      expect(indexHtmlNode).toBeDefined();
    });

    it('should handle nested exclusions correctly', async () => {
      // Mock nested structure
      (vscode.workspace.fs.readDirectory as jest.Mock)
        .mockResolvedValueOnce([
          ['src', vscode.FileType.Directory],
          ['node_modules', vscode.FileType.Directory],
        ])
        .mockResolvedValueOnce([
          ['main.js', vscode.FileType.File],
          ['utils.js', vscode.FileType.File],
        ])
        .mockResolvedValueOnce([
          ['package.json', vscode.FileType.File],
          ['index.js', vscode.FileType.File],
        ]);

      const result = await buildTreeData('/test', 10, true, 0);

      // Should include src folder
      const srcNode = result.find((node: any) => node.name === 'src');
      expect(srcNode).toBeDefined();
      expect(srcNode.type).toBe('directory');

      // Should not include node_modules
      const nodeModulesNode = result.find((node: any) => node.name === 'node_modules');
      expect(nodeModulesNode).toBeUndefined();
    });
  });

  describe('shouldExclude Function', () => {
    it('should exclude common build folders', () => {
      expect(shouldExclude('node_modules')).toBe(true);
      expect(shouldExclude('.git')).toBe(true);
      expect(shouldExclude('dist')).toBe(true);
      expect(shouldExclude('build')).toBe(true);
      expect(shouldExclude('out')).toBe(true);
    });

    it('should exclude common files', () => {
      expect(shouldExclude('.DS_Store')).toBe(true);
      expect(shouldExclude('Thumbs.db')).toBe(true);
      expect(shouldExclude('error.log')).toBe(true); // Test actual log file
      expect(shouldExclude('app.log')).toBe(true); // Test actual log file
    });

    it('should not exclude regular files', () => {
      expect(shouldExclude('main.js')).toBe(false);
      expect(shouldExclude('package.json')).toBe(false);
      expect(shouldExclude('README.md')).toBe(false);
      expect(shouldExclude('src')).toBe(false);
    });

    it('should not exclude important config files', () => {
      // These should NOT be auto-hidden as they are commonly needed
      expect(shouldExclude('.env')).toBe(false);
      expect(shouldExclude('.gitignore')).toBe(false);
      expect(shouldExclude('.prettierignore')).toBe(false);
      expect(shouldExclude('pnpm-lock.yaml')).toBe(false);
      expect(shouldExclude('.gitattributes')).toBe(false);
      expect(shouldExclude('.editorconfig')).toBe(false);
    });

    it('should not exclude TypeScript files with "log" in the name', () => {
      // Regression test for issue #5 - files with "log" in name should not be excluded
      expect(shouldExclude('requestLogger.ts')).toBe(false);
      expect(shouldExclude('errorLogger.js')).toBe(false);
      expect(shouldExclude('logger.py')).toBe(false);
      expect(shouldExclude('blogPost.md')).toBe(false);
    });

    it('should still exclude actual log files', () => {
      // These should still be excluded as they are log files
      expect(shouldExclude('error.log')).toBe(true);
      expect(shouldExclude('app.log')).toBe(true);
      expect(shouldExclude('debug.log')).toBe(true);
      expect(shouldExclude('access.log')).toBe(true);
    });

    it('should handle multi-language project files correctly', () => {
      // Python files that should be visible
      expect(shouldExclude('requirements.txt')).toBe(false);
      expect(shouldExclude('setup.py')).toBe(false);
      expect(shouldExclude('logger.py')).toBe(false);
      expect(shouldExclude('logging_config.py')).toBe(false);

      // Go files that should be visible
      expect(shouldExclude('go.mod')).toBe(false);
      expect(shouldExclude('go.sum')).toBe(false);
      expect(shouldExclude('logger.go')).toBe(false);

      // Rust files that should be visible
      expect(shouldExclude('Cargo.toml')).toBe(false);
      expect(shouldExclude('Cargo.lock')).toBe(false);
      expect(shouldExclude('logger.rs')).toBe(false);

      // Java files that should be visible
      expect(shouldExclude('pom.xml')).toBe(false);
      expect(shouldExclude('build.gradle')).toBe(false);
      expect(shouldExclude('Logger.java')).toBe(false);
      expect(shouldExclude('LoggerFactory.java')).toBe(false);

      // C# files that should be visible
      expect(shouldExclude('project.csproj')).toBe(false);
      expect(shouldExclude('solution.sln')).toBe(false);
      expect(shouldExclude('Logger.cs')).toBe(false);

      // PHP files that should be visible
      expect(shouldExclude('composer.json')).toBe(false);
      expect(shouldExclude('logger.php')).toBe(false);

      // Ruby files that should be visible
      expect(shouldExclude('Gemfile')).toBe(false);
      expect(shouldExclude('logger.rb')).toBe(false);
    });

    it('should handle JavaScript/TypeScript ecosystem files correctly', () => {
      // Lock files that should now be visible for debugging
      expect(shouldExclude('package-lock.json')).toBe(false);
      expect(shouldExclude('yarn.lock')).toBe(false);
      expect(shouldExclude('pnpm-lock.yaml')).toBe(false);
      expect(shouldExclude('poetry.lock')).toBe(false);

      // Config files that should be visible
      expect(shouldExclude('tsconfig.json')).toBe(false);
      expect(shouldExclude('webpack.config.js')).toBe(false);
      expect(shouldExclude('vite.config.js')).toBe(false);
      expect(shouldExclude('.eslintrc.json')).toBe(false);
    });

    it('should handle case-insensitive matching', () => {
      expect(shouldExclude('NODE_MODULES')).toBe(true);
      expect(shouldExclude('Node_Modules')).toBe(true);
      expect(shouldExclude('.GIT')).toBe(true);
    });

    it('should handle complex glob patterns (issue #5)', () => {
      // These are the patterns that were causing errors
      expect(shouldExclude('node_modules', '/project/node_modules')).toBe(true);
      expect(shouldExclude('dist', '/project/dist')).toBe(true);
      expect(shouldExclude('.git', '/project/.git')).toBe(true);
      expect(shouldExclude('.venv', '/project/.venv')).toBe(true);
      expect(shouldExclude('build', '/project/build')).toBe(true);
      expect(shouldExclude('coverage', '/project/coverage')).toBe(true);

      // Test files with .log extension
      expect(shouldExclude('app.log', '/project/logs/app.log')).toBe(true);
      expect(shouldExclude('error.log', '/project/error.log')).toBe(true);

      // Test files with .tmp extension
      expect(shouldExclude('temp.tmp', '/project/temp.tmp')).toBe(true);
      expect(shouldExclude('cache.tmp', '/project/cache/cache.tmp')).toBe(true);
    });

    it('should handle nested path patterns correctly', () => {
      // Test patterns like **/node_modules/** would match
      expect(shouldExclude('node_modules', '/deep/nested/path/node_modules')).toBe(true);
      expect(shouldExclude('dist', '/src/components/dist')).toBe(true);

      // But regular files in those paths should not be excluded just for being there
      expect(shouldExclude('index.js', '/project/src/index.js')).toBe(false);
      expect(shouldExclude('component.tsx', '/project/src/components/component.tsx')).toBe(false);
    });

    it('should not throw errors with complex user exclusion patterns', () => {
      // This should not throw an error (was the main issue)
      expect(() => {
        shouldExclude('node_modules', '/project/node_modules');
        shouldExclude('test.log', '/project/logs/test.log');
        shouldExclude('temp.tmp', '/project/temp/temp.tmp');
        shouldExclude('regular.js', '/project/src/regular.js');
      }).not.toThrow();
    });
  });
});
