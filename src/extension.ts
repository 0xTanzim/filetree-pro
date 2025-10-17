/**
 * FileTree Pro Extension Entry Point
 *
 * Initializes all services, providers, and commands using Dependency Injection.
 * Implements clean architecture with ServiceContainer for IoC.
 *
 * @module extension
 * @author FileTree Pro Team
 * @since 0.3.0
 */

import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { ServiceContainer } from './core/serviceContainer';
import { FileTreeProvider } from './providers/fileTreeProvider';
import { AnalyticsService } from './services/analyticsService';
import { CopilotService } from './services/copilotService';
import { ExclusionService } from './services/exclusionService';
import { FileSystemService } from './services/fileSystemService';
import { TreeBuilderService } from './services/treeBuilderService';
import { ErrorCategory, ErrorSeverity, getErrorHandler } from './utils/errorHandler';

// Global service container
let container: ServiceContainer | null = null;

/**
 * Extension activation entry point.
 * Called when the extension is activated (on command invocation).
 *
 * @param context - Extension context for registering subscriptions
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const errorHandler = getErrorHandler();

  try {
    console.log('[FileTree Pro] Activating extension...');

    // Initialize error handler
    errorHandler.initialize('FileTree Pro');

    // Create ServiceContainer
    console.log('[FileTree Pro] Initializing ServiceContainer...');
    container = new ServiceContainer();

    // Register services as singletons
    console.log('[FileTree Pro] Registering services...');
    container.singleton('fileSystemService', () => new FileSystemService());
    container.singleton('copilotService', () => new CopilotService());
    container.singleton('analyticsService', () => new AnalyticsService());
    container.singleton('exclusionService', () => new ExclusionService());
    container.singleton('treeBuilderService', () => {
      const exclusion = container!.resolve<ExclusionService>('exclusionService');
      return new TreeBuilderService(exclusion);
    });

    // Resolve core services for Tree Provider
    const fileSystemService = container.resolve<FileSystemService>('fileSystemService');
    const copilotService = container.resolve<CopilotService>('copilotService');
    const analyticsService = container.resolve<AnalyticsService>('analyticsService');

    // Initialize File Tree Provider
    console.log('[FileTree Pro] Initializing File Tree Provider...');
    const fileTreeProvider = new FileTreeProvider(
      fileSystemService,
      copilotService,
      analyticsService
    );

    // Register Tree View
    const treeView = vscode.window.createTreeView('filetree-pro-view', {
      treeDataProvider: fileTreeProvider,
      showCollapseAll: true,
    });
    context.subscriptions.push(treeView);
    console.log('[FileTree Pro] Tree View registered');

    // Register commands with ServiceContainer
    console.log('[FileTree Pro] Registering commands...');
    const commandDisposables = registerCommands(context, container);

    commandDisposables.forEach(command => {
      context.subscriptions.push(command);
    });

    // Register service disposables for cleanup
    context.subscriptions.push({
      dispose: () => {
        if (container) {
          // Dispose services if they have dispose methods
          if (container.has('fileSystemService')) {
            const fs = container.resolve<FileSystemService>('fileSystemService');
            fs.dispose();
          }
          if (container.has('copilotService')) {
            const copilot = container.resolve<CopilotService>('copilotService');
            copilot.dispose();
          }
          if (container.has('analyticsService')) {
            const analytics = container.resolve<AnalyticsService>('analyticsService');
            analytics.dispose();
          }
          container.clear();
          container = null;
        }
        errorHandler.dispose();
      },
    });

    // Show welcome message on first run
    await showWelcomeMessage(context);

    console.log('[FileTree Pro] Extension activated successfully');
  } catch (error) {
    const errorMessage = `Failed to activate FileTree Pro: ${error}`;
    console.error(errorMessage, error);

    await errorHandler.handleError({
      message: errorMessage,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.INTERNAL,
      originalError: error as Error,
      timestamp: new Date(),
    });

    vscode.window.showErrorMessage(errorMessage);
  }
}

/**
 * Extension deactivation entry point.
 * Called when the extension is deactivated (on VS Code shutdown or extension disable).
 * Ensures all resources are properly cleaned up.
 */
export async function deactivate(): Promise<void> {
  console.log('[FileTree Pro] Deactivating extension...');

  // Services are automatically disposed via context.subscriptions
  // This function can be used for additional cleanup if needed

  console.log('[FileTree Pro] Extension deactivated');
}

/**
 * Shows welcome message to first-time users.
 * Provides quick start guidance and feature highlights.
 *
 * @param context - Extension context for state management
 */
async function showWelcomeMessage(context: vscode.ExtensionContext): Promise<void> {
  const isFirstRun = context.globalState.get('filetree-pro.firstRun', true);

  if (isFirstRun) {
    const selection = await vscode.window.showInformationMessage(
      'Welcome to FileTree Pro! 🌳 Generate beautiful file trees for documentation.',
      'Quick Start',
      'Learn More',
      'Dismiss'
    );

    if (selection === 'Quick Start') {
      await vscode.window.showInformationMessage(
        'Right-click any folder in Explorer and select "Generate File Tree" to get started!'
      );
    } else if (selection === 'Learn More') {
      await vscode.window.showInformationMessage(
        'FileTree Pro Features:\n' +
          '✨ Smart file tree generation\n' +
          '📊 Project analytics\n' +
          '🤖 AI-powered insights (with GitHub Copilot)\n' +
          '🎨 Multiple export formats (Markdown, JSON, SVG)'
      );
    }

    await context.globalState.update('filetree-pro.firstRun', false);
  }
}
