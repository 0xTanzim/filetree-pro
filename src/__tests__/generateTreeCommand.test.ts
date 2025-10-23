/**
 * Test Suite: GenerateTreeCommand
 * Tests the main tree generation command with proper method signatures
 *
 * @author FileTree Pro Team
 * @since 0.3.0
 */

import * as vscode from 'vscode';
import { GenerateTreeCommand } from '../commands/generateTreeCommand';
import { ExclusionService } from '../services/exclusionService';
import { TreeBuilderService } from '../services/treeBuilderService';

describe('GenerateTreeCommand', () => {
  let command: GenerateTreeCommand;
  let mockTreeBuilderService: jest.Mocked<TreeBuilderService>;
  let mockExclusionService: jest.Mocked<ExclusionService>;

  beforeEach(() => {
    // Create mock ExclusionService
    mockExclusionService = {
      shouldExclude: jest.fn().mockReturnValue(false),
      readGitignore: jest.fn().mockResolvedValue(['node_modules/', 'dist/']),
      dispose: jest.fn(),
    } as any;

    // Create mock TreeBuilderService
    mockTreeBuilderService = {
      buildFileTreeItems: jest.fn().mockResolvedValue([
        {
          name: 'src',
          type: 'folder',
          path: '/test/src',
          children: [
            { name: 'index.ts', type: 'file', path: '/test/src/index.ts' },
            { name: 'utils.ts', type: 'file', path: '/test/src/utils.ts' },
          ],
        },
        { name: 'package.json', type: 'file', path: '/test/package.json' },
        { name: 'README.md', type: 'file', path: '/test/README.md' },
      ]),
      generateTreeLines: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Create command instance
    command = new GenerateTreeCommand(mockTreeBuilderService);

    // Reset VS Code mocks
    jest.clearAllMocks();
  });

  // Helper function to setup successful execution mocks
  const setupSuccessfulMocks = (format = 'markdown', icons = true) => {
    (vscode.window.showQuickPick as jest.Mock)
      .mockResolvedValueOnce({ label: `📄 ${format}`, value: format })
      .mockResolvedValueOnce(icons ? 'With Icons' : 'Without Icons');

    (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
      const progress = { report: jest.fn() };
      const token = {
        isCancellationRequested: false,
        onCancellationRequested: jest.fn(),
      };
      return task(progress, token);
    });

    (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue({
      uri: vscode.Uri.file('/test/output.md'),
      languageId:
        format === 'json'
          ? 'json'
          : format === 'svg'
            ? 'xml'
            : format === 'ascii'
              ? 'plaintext'
              : 'markdown',
      getText: jest.fn().mockReturnValue('# Mock content'),
    });

    (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
  };

  describe('Command Execution', () => {
    test('should show error when URI is not provided', async () => {
      await command.execute(undefined as any);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Please right-click on a folder to generate file tree'
      );
      expect(mockTreeBuilderService.buildFileTreeItems).not.toHaveBeenCalled();
    });

    test('should execute successfully with valid URI', async () => {
      setupSuccessfulMocks();
      const mockUri = vscode.Uri.file('/test/project');

      await command.execute(mockUri);

      expect(vscode.window.showQuickPick).toHaveBeenCalledTimes(2);
      expect(mockTreeBuilderService.buildFileTreeItems).toHaveBeenCalled();
      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
      expect(vscode.window.showTextDocument).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('File tree generated successfully')
      );
    });

    test('should handle user cancelling format selection', async () => {
      (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce(undefined); // User cancels

      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      expect(mockTreeBuilderService.buildFileTreeItems).not.toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
    });

    test('should handle user cancelling icon selection', async () => {
      (vscode.window.showQuickPick as jest.Mock)
        .mockResolvedValueOnce({ label: '📄 Markdown', value: 'markdown' })
        .mockResolvedValueOnce(undefined); // User cancels icon choice

      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      expect(mockTreeBuilderService.buildFileTreeItems).not.toHaveBeenCalled();
    });

    test('should handle errors during tree generation', async () => {
      setupSuccessfulMocks();
      mockTreeBuilderService.buildFileTreeItems.mockRejectedValueOnce(
        new Error('Permission denied')
      );

      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate file tree')
      );
    });
  });

  describe('Format Selection', () => {
    test('should support Markdown format', async () => {
      setupSuccessfulMocks('markdown');
      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'markdown' })
      );
    });

    test('should support JSON format', async () => {
      setupSuccessfulMocks('json');
      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'json' })
      );
    });

    test('should support SVG format', async () => {
      setupSuccessfulMocks('svg');
      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'xml' })
      );
    });

    test('should support ASCII format', async () => {
      setupSuccessfulMocks('ascii');
      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'plaintext' })
      );
    });
  });

  describe('Icon Preferences', () => {
    test('should respect "With Icons" preference', async () => {
      setupSuccessfulMocks('markdown', true);
      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      // Verify buildFileTreeItems was called with progress callback
      expect(mockTreeBuilderService.buildFileTreeItems).toHaveBeenCalledWith(
        expect.any(String), // rootPath
        10, // maxDepth
        expect.any(String), // rootPath again
        0, // depth
        expect.any(Function) // progressCallback
      );
    });

    test('should respect "Without Icons" preference', async () => {
      setupSuccessfulMocks('markdown', false);
      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      expect(mockTreeBuilderService.buildFileTreeItems).toHaveBeenCalled();
    });
  });

  describe('Progress Reporting', () => {
    test('should show progress notification during generation', async () => {
      setupSuccessfulMocks();
      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      expect(vscode.window.withProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
        }),
        expect.any(Function)
      );
    });

    test('should handle cancellation during progress', async () => {
      (vscode.window.showQuickPick as jest.Mock)
        .mockResolvedValueOnce({ label: '📄 Markdown', value: 'markdown' })
        .mockResolvedValueOnce('With Icons');

      (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
        const progress = { report: jest.fn() };
        const token = {
          isCancellationRequested: true, // Simulate cancellation
          onCancellationRequested: jest.fn(),
        };
        return task(progress, token);
      });

      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Tree generation cancelled'
      );
    });

    test('should report progress increments', async () => {
      let reportedProgress: any[] = [];
      (vscode.window.showQuickPick as jest.Mock)
        .mockResolvedValueOnce({ label: '📄 Markdown', value: 'markdown' })
        .mockResolvedValueOnce('With Icons');

      (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
        const progress = {
          report: jest.fn(value => reportedProgress.push(value)),
        };
        const token = {
          isCancellationRequested: false,
          onCancellationRequested: jest.fn(),
        };
        return task(progress, token);
      });

      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue({
        uri: vscode.Uri.file('/test/output.md'),
        languageId: 'markdown',
        getText: jest.fn().mockReturnValue('# Mock content'),
      });

      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      const mockUri = vscode.Uri.file('/test/project');
      await command.execute(mockUri);

      // Should have reported progress at various stages
      expect(reportedProgress.length).toBeGreaterThan(0);
      expect(reportedProgress.some(p => p.message?.includes('Starting'))).toBe(true);
    });
  });

  describe('Command Registration', () => {
    test('should register command with VS Code', () => {
      const mockContext = {
        subscriptions: [],
        extensionPath: '/test/extension',
      } as any;

      const disposable = GenerateTreeCommand.register(mockContext, mockTreeBuilderService);

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'filetree-pro.generateFileTree',
        expect.any(Function)
      );
      expect(disposable).toBeDefined();
    });
  });

  describe('Notification Blocking Issue - Fix Verification', () => {
    test('should not block showQuickPick with welcome notifications', async () => {
      // This test verifies the fix for the issue where welcome notifications
      // blocked the format selection dialog

      // Setup format selection mock
      (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce({
        label: '📄 Markdown',
        value: 'markdown',
      });

      // Setup icon selection mock
      (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce('With Icons');

      // Setup progress mock
      (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, callback) => {
        const mockProgress = { report: jest.fn() };
        const mockToken = { isCancellationRequested: false };
        await callback(mockProgress, mockToken);
      });

      // Setup document mock
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValueOnce({
        content: '# File Tree',
      });

      const mockUri = vscode.Uri.file('/test/project');

      // Execute command - should successfully show format picker WITHOUT blocking
      await command.execute(mockUri);

      // Verify showQuickPick was called (not blocked)
      expect(vscode.window.showQuickPick).toHaveBeenCalled();

      // Verify format choice was provided (first call returns format, not undefined)
      const firstCall = (vscode.window.showQuickPick as jest.Mock).mock.calls[0];
      expect(firstCall[0]).toContainEqual({ label: '📄 Markdown', value: 'markdown' });
    });
  });
});
