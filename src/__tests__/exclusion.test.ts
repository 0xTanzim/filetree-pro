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

    it('should handle case-insensitive matching', () => {
      expect(shouldExclude('NODE_MODULES')).toBe(true);
      expect(shouldExclude('Node_Modules')).toBe(true);
      expect(shouldExclude('.GIT')).toBe(true);
    });
  });
});
