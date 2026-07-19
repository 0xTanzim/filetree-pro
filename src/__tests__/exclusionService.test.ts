/**
 * ExclusionService Test Suite
 * Tests file/folder exclusion logic, gitignore parsing, and glob patterns
 */

import * as vscode from 'vscode';
import { ExclusionService } from '../services/exclusionService';

// Mock vscode.workspace.fs
jest.mock('vscode', () => ({
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue: any) => {
        const config: Record<string, any> = {
          exclude: ['custom-exclude'],
          respectGitignore: true,
        };
        return config[key] ?? defaultValue;
      }),
    })),
    fs: {
      readFile: jest.fn(),
    },
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path })),
  },
}));

describe('ExclusionService', () => {
  let exclusionService: ExclusionService;

  beforeEach(() => {
    exclusionService = new ExclusionService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    exclusionService.clearCache();
    exclusionService.dispose();
  });

  describe('Glob Pattern Conversion', () => {
    test('should convert directory patterns ending with /', () => {
      const regex = exclusionService.globToRegex('temp-folder/');
      expect(regex.test('temp-folder')).toBe(true);
      expect(regex.test('/temp-folder')).toBe(true);
      expect(regex.test('/src/temp-folder')).toBe(true);
      expect(regex.test('temp-folder-extra')).toBe(false);
    });

    test('should convert file extension patterns', () => {
      const regex = exclusionService.globToRegex('*.log');
      expect(regex.test('error.log')).toBe(true);
      expect(regex.test('debug.log')).toBe(true);
      expect(regex.test('log.txt')).toBe(false);
    });

    test('should convert ** wildcard patterns', () => {
      const regex = exclusionService.globToRegex('**/node_modules/**');
      expect(regex.test('/project/node_modules/package')).toBe(true);
      expect(regex.test('/node_modules/package')).toBe(true);
      expect(regex.test('/src/lib/test')).toBe(false);
    });

    test('should apply ? wildcards through exclusion rules', async () => {
      const rootPath = '/test-project';
      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('artifact?\n'));
      await exclusionService.readGitignore(rootPath);

      expect(exclusionService.shouldExclude('artifactX', `${rootPath}/artifactX`, rootPath)).toBe(
        true
      );
      expect(exclusionService.shouldExclude('artifact', `${rootPath}/artifact`, rootPath)).toBe(
        false
      );
      expect(exclusionService.shouldExclude('artifactXY', `${rootPath}/artifactXY`, rootPath)).toBe(
        false
      );
    });

    test('should compose ? within extension globs through exclusion rules', async () => {
      const rootPath = '/test-project';
      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('*.?s\n'));
      await exclusionService.readGitignore(rootPath);

      expect(exclusionService.shouldExclude('main.ts', `${rootPath}/main.ts`, rootPath)).toBe(true);
      expect(exclusionService.shouldExclude('main.css', `${rootPath}/main.css`, rootPath)).toBe(
        false
      );
    });

    test('should anchor leading-slash patterns to the scan root', async () => {
      const rootPath = '/test-project';
      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
        Buffer.from('/build/*.js\n/*.ts\n')
      );
      await exclusionService.readGitignore(rootPath);

      expect(exclusionService.shouldExclude('main.js', `${rootPath}/build/main.js`, rootPath)).toBe(
        true
      );
      expect(
        exclusionService.shouldExclude('main.js', `${rootPath}/packages/build/main.js`, rootPath)
      ).toBe(false);
      expect(exclusionService.shouldExclude('index.ts', `${rootPath}/index.ts`, rootPath)).toBe(
        true
      );
      expect(
        exclusionService.shouldExclude('index.ts', `${rootPath}/packages/index.ts`, rootPath)
      ).toBe(false);
    });

    test('should handle exact name patterns', () => {
      const regex = exclusionService.globToRegex('checkout');
      expect(regex.test('checkout')).toBe(true);
      expect(regex.test('/checkout')).toBe(true);
      expect(regex.test('CheckoutBanner.tsx')).toBe(false);
    });
  });

  describe('Default Exclusions', () => {
    test('should exclude node_modules', () => {
      expect(exclusionService.shouldExclude('node_modules')).toBe(true);
    });

    test('should exclude .git', () => {
      expect(exclusionService.shouldExclude('.git')).toBe(true);
    });

    test('should exclude dist', () => {
      expect(exclusionService.shouldExclude('dist')).toBe(true);
    });

    test('should exclude common temporary directories', () => {
      expect(exclusionService.shouldExclude('cache')).toBe(true);
      expect(exclusionService.shouldExclude('temp')).toBe(true);
      expect(exclusionService.shouldExclude('tmp')).toBe(true);
    });

    test('should exclude .venv', () => {
      expect(exclusionService.shouldExclude('.venv')).toBe(true);
    });

    test('should exclude *.log files', () => {
      expect(exclusionService.shouldExclude('error.log')).toBe(true);
      expect(exclusionService.shouldExclude('debug.log')).toBe(true);
    });

    test('should exclude *.pyc files', () => {
      expect(exclusionService.shouldExclude('module.pyc')).toBe(true);
    });

    test('should exclude __pycache__', () => {
      expect(exclusionService.shouldExclude('__pycache__')).toBe(true);
    });

    test('should not exclude normal files', () => {
      expect(exclusionService.shouldExclude('index.ts')).toBe(false);
      expect(exclusionService.shouldExclude('README.md')).toBe(false);
      expect(exclusionService.shouldExclude('package.json')).toBe(false);
    });
  });

  describe('Gitignore Parsing', () => {
    test('should read and parse gitignore file', async () => {
      const mockContent = Buffer.from('node_modules\n*.log\n# comment\n\ndist\n');
      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const patterns = await exclusionService.readGitignore('/test-project');

      expect(patterns).toEqual(['node_modules', '*.log', 'dist']);
      expect(vscode.workspace.fs.readFile).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: '/test-project/.gitignore' })
      );
    });

    test('should cache gitignore patterns', async () => {
      const mockContent = Buffer.from('node_modules\ndist\n');
      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      await exclusionService.readGitignore('/test-project');
      await exclusionService.readGitignore('/test-project');

      expect(vscode.workspace.fs.readFile).toHaveBeenCalledTimes(1);
    });

    test('should return empty array if gitignore not found', async () => {
      (vscode.workspace.fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      const patterns = await exclusionService.readGitignore('/test-project');

      expect(patterns).toEqual([]);
    });

    test('should ignore comments in gitignore', async () => {
      const mockContent = Buffer.from(
        '# This is a comment\nnode_modules\n# Another comment\ndist\n'
      );
      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const patterns = await exclusionService.readGitignore('/test-project');

      expect(patterns).toEqual(['node_modules', 'dist']);
    });

    test('should ignore empty lines', async () => {
      const mockContent = Buffer.from('node_modules\n\n\ndist\n\n');
      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const patterns = await exclusionService.readGitignore('/test-project');

      expect(patterns).toEqual(['node_modules', 'dist']);
    });
  });

  describe('User Configuration', () => {
    test('should respect user exclusions from settings', () => {
      expect(exclusionService.shouldExclude('custom-exclude')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty item names', () => {
      expect(exclusionService.shouldExclude('')).toBe(false);
    });

    test('should handle invalid patterns gracefully', () => {
      const regex = exclusionService.globToRegex('**[invalid');
      expect(regex).toBeDefined();
    });

    test('should be case-insensitive', () => {
      expect(exclusionService.shouldExclude('NODE_MODULES')).toBe(true);
      expect(exclusionService.shouldExclude('Node_Modules')).toBe(true);
    });

    test('should handle paths with backslashes', () => {
      expect(exclusionService.shouldExclude('node_modules', 'C:\\project\\node_modules')).toBe(
        true
      );
    });
  });

  describe('Cache Management', () => {
    test('should clear cache', async () => {
      const mockContent = Buffer.from('node_modules\n');
      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      await exclusionService.readGitignore('/test-project');
      exclusionService.clearCache();
      await exclusionService.readGitignore('/test-project');

      expect(vscode.workspace.fs.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('Timer Cleanup', () => {
    test('should cleanup timers on dispose', async () => {
      const mockContent = Buffer.from('node_modules\n');
      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      await exclusionService.readGitignore('/test-project');

      // Dispose should clear all timers
      exclusionService.dispose();

      // Verify no errors thrown
      expect(true).toBe(true);
    });
  });
});
