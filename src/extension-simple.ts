import * as vscode from 'vscode';

console.log('Test extension starting...');

export function activate(context: vscode.ExtensionContext): void {
  console.log('Test extension is now active!');

  vscode.window.showInformationMessage('Hello from FileTree Pro!');
}

export function deactivate(): void {
  console.log('Test extension deactivated');
}
