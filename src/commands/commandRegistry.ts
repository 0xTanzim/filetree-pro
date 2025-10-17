/**
 * Command Registry - Central command registration
 * Orchestrates all command registrations using Dependency Injection
 *
 * @module commands
 * @since 0.3.0
 */

import * as vscode from 'vscode';
import { ServiceContainer } from '../core/serviceContainer';
import { TreeBuilderService } from '../services/treeBuilderService';
import { ConvertTextCommand } from './convertTextCommand';
import { GenerateTreeCommand } from './generateTreeCommand';

/**
 * Register all extension commands
 * Uses ServiceContainer for dependency injection
 *
 * @param context - Extension context
 * @param container - Service container
 * @returns Array of disposables
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  container: ServiceContainer
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Resolve services from container
  const treeBuilderService = container.resolve<TreeBuilderService>('treeBuilderService');

  // Register Generate Tree Command
  disposables.push(GenerateTreeCommand.register(context, treeBuilderService));

  // Register Convert Text Command
  disposables.push(ConvertTextCommand.register(context));

  return disposables;
}
