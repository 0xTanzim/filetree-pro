import * as vscode from 'vscode';
import { registerCommands } from './commands/commands';

export function activate(context: vscode.ExtensionContext): void {
  console.log('FileTree Pro is now active!');

  // Register commands
  const commands = registerCommands();
  commands.forEach(command => {
    context.subscriptions.push(command);
  });

  // Show welcome message if first time
  showWelcomeMessage(context);
}

export function deactivate(): void {
  // Clean up resources
}

function showWelcomeMessage(context: vscode.ExtensionContext): void {
  const isFirstRun = context.globalState.get('filetree-pro.firstRun', true);

  if (isFirstRun) {
    vscode.window
      .showInformationMessage(
        'Welcome to FileTree Pro! 🚀 Right-click on any folder to generate a file tree.',
        'Learn More'
      )
      .then(selection => {
        if (selection === 'Learn More') {
          vscode.window.showInformationMessage(
            'FileTree Pro generates beautiful file tree documents that you can share with others! 🚀'
          );
        }
      });

    context.globalState.update('filetree-pro.firstRun', false);
  }
}
