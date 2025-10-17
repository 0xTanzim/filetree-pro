/**
 * Generate Tree Command - Main tree generation command
 * Handles user interaction, formatting, and tree display
 *
 * @module commands
 * @since 0.3.0
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { FormatterFactory, FormatterType } from '../formatters';
import { TreeBuilderService } from '../services/treeBuilderService';

/**
 * Generate file tree command handler
 * Implements Single Responsibility Principle
 */
export class GenerateTreeCommand {
  constructor(private treeBuilderService: TreeBuilderService) {}

  /**
   * Execute the generate tree command
   * @param uri - URI of the folder to generate tree for
   */
  async execute(uri: vscode.Uri): Promise<void> {
    try {
      if (!uri) {
        vscode.window.showErrorMessage('Please right-click on a folder to generate file tree');
        return;
      }

      // Get the folder path
      const folderPath = uri.fsPath;
      const folderName = path.basename(folderPath);

      // Ask user for format preference
      const formatChoice = await vscode.window.showQuickPick(
        [
          { label: '📄 Markdown', value: 'markdown' },
          { label: '📊 JSON', value: 'json' },
          { label: '🎨 SVG', value: 'svg' },
          { label: '📝 ASCII', value: 'ascii' },
        ],
        {
          placeHolder: 'Choose output format',
          canPickMany: false,
        }
      );

      if (!formatChoice) {
        return; // User cancelled
      }

      // Ask user for icon preference
      const iconChoice = await vscode.window.showQuickPick(['With Icons', 'Without Icons'], {
        placeHolder: 'Choose tree style',
        canPickMany: false,
      });

      if (!iconChoice) {
        return; // User cancelled
      }

      const useIcons = iconChoice === 'With Icons';

      // Show progress with loading indicator
      const progressOptions = {
        location: vscode.ProgressLocation.Notification,
        title: `Generating file tree for ${folderName}`,
        cancellable: false,
      };

      await vscode.window.withProgress(progressOptions, async progress => {
        progress.report({ message: 'Starting tree generation...' });

        // Generate the file tree
        const treeContent = await this.generateFileTree(
          folderPath,
          10,
          useIcons,
          formatChoice.value,
          message => {
            progress.report({ message });
          }
        );

        progress.report({ message: 'Creating document...' });

        // Get language ID from formatter
        const formatterType = formatChoice.value as FormatterType;
        const formatter = FormatterFactory.createFormatter(formatterType);
        const languageId = formatter.getLanguageId();

        // Create an untitled document with the tree content
        const document = await vscode.workspace.openTextDocument({
          content: treeContent,
          language: languageId,
        });

        // Show the document in a new tab (unsaved mode)
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(
          `File tree generated successfully! Ready to save when you're ready.`
        );
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to generate file tree: ${error}`);
    }
  }

  /**
   * Generate file tree using FormatterFactory
   * @private
   */
  private async generateFileTree(
    rootPath: string,
    maxDepth: number = 10,
    forceShowIcons?: boolean,
    format: string = 'markdown',
    progressCallback?: (message: string) => void
  ): Promise<string> {
    // Get user settings or use forced value
    const config = vscode.workspace.getConfiguration('filetree-pro');
    const showIcons =
      forceShowIcons !== undefined ? forceShowIcons : config.get<boolean>('showIcons', true);

    // Build tree items
    if (progressCallback) {
      progressCallback('Building file tree structure...');
    }

    const items = await this.treeBuilderService.buildFileTreeItems(
      rootPath,
      maxDepth,
      rootPath,
      0,
      progressCallback
    );

    // Use FormatterFactory to get formatter
    if (progressCallback) {
      progressCallback(`Formatting as ${format.toUpperCase()}...`);
    }

    const formatterType = format as FormatterType;
    if (!FormatterFactory.hasFormatter(format)) {
      throw new Error(`Unknown format: ${format}`);
    }

    const formatter = FormatterFactory.createFormatter(formatterType);
    const result = await formatter.format(items, {
      rootPath,
      showIcons,
      maxDepth,
    });

    return result.content;
  }

  /**
   * Register the command with VS Code
   * @param context - Extension context
   * @returns Disposable
   */
  static register(
    context: vscode.ExtensionContext,
    treeBuilderService: TreeBuilderService
  ): vscode.Disposable {
    const command = new GenerateTreeCommand(treeBuilderService);
    return vscode.commands.registerCommand('filetree-pro.generateFileTree', (uri: vscode.Uri) =>
      command.execute(uri)
    );
  }
}
