import * as vscode from 'vscode';

console.log('Test extension starting...');

export function activate(context: vscode.ExtensionContext): void {
  console.log('Test extension is now active!');

  vscode.window.showInformationMessage('Hello from FileTreeProAI!');
}

export function deactivate(): void {
  console.log('Test extension deactivated');
}
