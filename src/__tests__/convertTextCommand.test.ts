/**
 * Test Suite: ConvertTextCommand
 * Tests text to tree format conversion
 *
 * @author FileTree Pro Team
 * @since 0.3.0
 */

import * as vscode from 'vscode';
import { ConvertTextCommand } from '../commands/convertTextCommand';

describe('ConvertTextCommand', () => {
  let command: ConvertTextCommand;
  let mockEditor: any;
  let mockDocument: any;

  beforeEach(() => {
    jest.clearAllMocks();
    command = new ConvertTextCommand();

    // Create mock document
    mockDocument = {
      getText: jest.fn(),
      uri: vscode.Uri.file('/test/file.txt'),
      fileName: '/test/file.txt',
      isUntitled: false,
      languageId: 'plaintext',
      version: 1,
      isDirty: false,
      isClosed: false,
      save: jest.fn(),
      eol: vscode.EndOfLine.LF,
      lineCount: 10,
    };

    // Create mock editor
    mockEditor = {
      document: mockDocument,
      selection: new vscode.Selection(0, 0, 5, 10),
      selections: [],
      visibleRanges: [],
      options: {},
      viewColumn: vscode.ViewColumn.One,
    };
  });

  describe('Command Execution', () => {
    test('should show error when no active editor', async () => {
      // Mock no active editor
      (vscode.window as any).activeTextEditor = undefined;

      await command.execute();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No active editor found');
    });

    test('should show error when no text selected', async () => {
      mockDocument.getText.mockReturnValue('   '); // Empty/whitespace only
      (vscode.window as any).activeTextEditor = mockEditor;

      await command.execute();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Please select some text to convert to tree format'
      );
    });

    test('should convert selected text successfully', async () => {
      const selectedText = `src/
components/
Header.tsx
Footer.tsx
index.ts`;

      mockDocument.getText.mockReturnValue(selectedText);
      (vscode.window as any).activeTextEditor = mockEditor;

      // Mock document creation
      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'markdown',
          content: expect.stringContaining('# File Tree from Text'),
        })
      );

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Text converted to tree format successfully!'
      );
    });

    test('should handle conversion errors gracefully', async () => {
      mockDocument.getText.mockReturnValue('valid text');
      (vscode.window as any).activeTextEditor = mockEditor;

      // Mock error during document creation
      (vscode.workspace.openTextDocument as jest.Mock).mockRejectedValue(
        new Error('Document creation failed')
      );

      await command.execute();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to convert text')
      );
    });
  });

  describe('Text to Tree Conversion', () => {
    test('should detect folders by trailing slash', async () => {
      const text = `src/
lib/
index.ts`;

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      // Should contain folder icons for items with trailing slashes
      expect(content).toContain('📁 src/');
      expect(content).toContain('📁 lib/');
      expect(content).toContain('📄 index.ts');
    });

    test('should detect files by extension', async () => {
      const text = `app.tsx
README.md
package.json`;

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      // All should be files (have extensions)
      expect(content).toContain('📄 app.tsx');
      expect(content).toContain('📄 README.md');
      expect(content).toContain('📄 package.json');
    });

    test('should handle items without extension as folders', async () => {
      const text = `Dockerfile
Makefile
src`;

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      // Items without extensions should be treated as folders
      expect(content).toContain('📁 Dockerfile');
      expect(content).toContain('📁 Makefile');
      expect(content).toContain('📁 src');
    });

    test('should add tree connectors (├── and └──)', async () => {
      const text = `file1.ts
file2.js
file3.md`;

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      // Should have tree connectors
      expect(content).toContain('├──');
      expect(content).toContain('└──'); // Last item
    });

    test('should add header and footer', async () => {
      const text = 'file.txt';

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      expect(content).toContain('# File Tree from Text');
      expect(content).toContain('*Generated by FileTree Pro Extension*');
    });

    test('should filter empty lines', async () => {
      const text = `file1.txt


file2.txt

`;

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      // Should only have 2 files (empty lines filtered)
      const fileMatches = content.match(/📄/g);
      expect(fileMatches?.length).toBe(2);
    });

    test('should handle indentation for depth visualization', async () => {
      const text = `level1
level2
level3
level4`;

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      // Should have progressive indentation
      expect(content).toContain('├──');
      expect(content.split('\n').some((line: string) => line.includes('  ├──'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle single line input', async () => {
      const text = 'single-file.txt';

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalled();
    });

    test('should handle very long file names', async () => {
      const text = 'this-is-a-very-long-file-name-that-might-cause-issues-with-formatting.txt';

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      expect(content).toContain('this-is-a-very-long-file-name');
    });

    test('should handle special characters in names', async () => {
      const text = `file-with-dashes.ts
file_with_underscores.js
file with spaces.md
file@special#chars.txt`;

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      // Should preserve special characters
      expect(content).toContain('file-with-dashes');
      expect(content).toContain('file_with_underscores');
      expect(content).toContain('file with spaces');
      expect(content).toContain('file@special#chars');
    });

    test('should handle mixed line endings (\\n and \\r\\n)', async () => {
      const text = `file1.txt\nfile2.txt\r\nfile3.txt`;

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
    });

    test('should handle backslash path separators (Windows)', async () => {
      const text = `src\\
components\\
App.tsx`;

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      // Should recognize backslash as folder indicator
      expect(content).toContain('📁 src\\');
      expect(content).toContain('📁 components\\');
    });

    test('should limit indentation depth for readability', async () => {
      // Test with many lines to check depth limiting
      const lines = Array.from({ length: 20 }, (_, i) => `level${i}.txt`);
      const text = lines.join('\n');

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      const callArgs = (vscode.workspace.openTextDocument as jest.Mock).mock.calls[0][0];
      const content = callArgs.content;

      // Indentation should be limited (max 3 levels)
      const maxIndent = Math.max(
        ...content
          .split('\n')
          .filter((line: string) => line.includes('├──') || line.includes('└──'))
          .map((line: string) => {
            const match = line.match(/^(\s*)/);
            return match ? match[1].length : 0;
          })
      );

      // Max indent should be 6 spaces (3 levels * 2 spaces)
      expect(maxIndent).toBeLessThanOrEqual(6);
    });
  });

  describe('Command Registration', () => {
    test('should register command with VS Code', () => {
      const mockContext = {
        subscriptions: [],
      } as any;

      const disposable = ConvertTextCommand.register(mockContext);

      expect(disposable).toBeDefined();
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'filetree-pro.convertTextToTree',
        expect.any(Function)
      );
    });

    test('should return disposable object', () => {
      const mockContext = {
        subscriptions: [],
      } as any;

      const disposable = ConvertTextCommand.register(mockContext);

      expect(disposable).toHaveProperty('dispose');
      expect(typeof disposable.dispose).toBe('function');
    });
  });

  describe('Document Creation', () => {
    test('should create document with markdown language', async () => {
      const text = 'file.txt';

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'markdown',
        })
      );
    });

    test('should open created document in editor', async () => {
      const text = 'file.txt';

      mockDocument.getText.mockReturnValue(text);
      (vscode.window as any).activeTextEditor = mockEditor;

      const mockNewDocument = { uri: vscode.Uri.file('/untitled-1') };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockNewDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});

      await command.execute();

      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mockNewDocument);
    });
  });
});
