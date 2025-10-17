/**
 * Tree Builder Service - Constructs file tree structures
 * Handles file system traversal and tree generation
 *
 * @module services
 * @since 0.3.0
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { FileTreeItem } from '../types';
import { getFileTypeInfo } from '../utils/fileUtils';
import { ExclusionService } from './exclusionService';

/**
 * Progress callback type
 */
type ProgressCallback = (message: string) => void;

/**
 * Service for building file tree structures
 * Handles recursion, sorting, and progress reporting
 */
export class TreeBuilderService {
  constructor(private exclusionService: ExclusionService) {}

  /**
   * Build FileTreeItem array from file system
   *
   * @param currentPath - Current directory path
   * @param maxDepth - Maximum depth to traverse
   * @param rootPath - Root path for exclusion checks
   * @param depth - Current depth (default: 0)
   * @param progressCallback - Optional progress callback
   * @returns Array of FileTreeItem
   */
  async buildFileTreeItems(
    currentPath: string,
    maxDepth: number,
    rootPath: string,
    depth: number = 0,
    progressCallback?: ProgressCallback
  ): Promise<FileTreeItem[]> {
    if (depth > maxDepth) {
      return [];
    }

    try {
      if (progressCallback && depth === 0) {
        progressCallback(`Building tree: ${path.basename(currentPath)}`);
      }

      const items = await vscode.workspace.fs.readDirectory(vscode.Uri.file(currentPath));
      const result: FileTreeItem[] = [];

      // Sort items: folders first, then files
      const folders: string[] = [];
      const files: string[] = [];

      for (const [item, fileType] of items) {
        const itemPath = path.join(currentPath, item);
        const isExcluded = this.exclusionService.shouldExclude(item, itemPath, rootPath);

        if (!isExcluded) {
          if (fileType === vscode.FileType.Directory) {
            folders.push(item);
          } else {
            files.push(item);
          }
        }
      }

      // Sort alphabetically
      folders.sort();
      files.sort();

      // Process folders recursively
      for (const folder of folders) {
        const folderPath = path.join(currentPath, folder);
        const children = await this.buildFileTreeItems(
          folderPath,
          maxDepth,
          rootPath,
          depth + 1,
          progressCallback
        );

        result.push({
          name: folder,
          type: 'folder',
          path: folderPath,
          children,
        });
      }

      // Process files
      for (const file of files) {
        const filePath = path.join(currentPath, file);
        result.push({
          name: file,
          type: 'file',
          path: filePath,
        });
      }

      return result;
    } catch (error) {
      if (progressCallback) {
        progressCallback(`Error reading directory: ${error}`);
      }
      return [];
    }
  }

  /**
   * Generate ASCII tree lines (for text-based representations)
   *
   * @param currentPath - Current directory path
   * @param prefix - Line prefix for indentation
   * @param lines - Output array to append lines
   * @param depth - Current depth
   * @param maxDepth - Maximum depth
   * @param showIcons - Whether to show icons
   * @param rootPath - Root path
   * @param progressCallback - Optional progress callback
   */
  async generateTreeLines(
    currentPath: string,
    prefix: string,
    lines: string[],
    depth: number,
    maxDepth: number,
    showIcons: boolean,
    rootPath: string,
    progressCallback?: ProgressCallback
  ): Promise<void> {
    if (depth > maxDepth) {
      return;
    }

    try {
      if (progressCallback && depth === 0) {
        progressCallback(`Reading directory: ${path.basename(currentPath)}`);
      }

      const items = await vscode.workspace.fs.readDirectory(vscode.Uri.file(currentPath));

      // Sort items: folders first, then files
      const folders: string[] = [];
      const files: string[] = [];

      // Process items in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        // Process batch asynchronously
        const batchPromises = batch.map(async ([item, fileType]) => {
          const itemPath = path.join(currentPath, item);
          const isExcluded = this.exclusionService.shouldExclude(item, itemPath, rootPath);

          if (fileType === vscode.FileType.Directory) {
            return { item, type: 'folder' as const, isExcluded };
          } else {
            return { item, type: 'file' as const, isExcluded };
          }
        });

        const batchResults = await Promise.all(batchPromises);

        for (const result of batchResults) {
          if (result && !result.isExcluded) {
            if (result.type === 'folder') {
              folders.push(result.item);
            } else {
              files.push(result.item);
            }
          }
        }

        // Update progress for large directories
        if (progressCallback && items.length > batchSize) {
          const progress = Math.min(100, Math.round(((i + batchSize) / items.length) * 100));
          progressCallback(`Processing items: ${progress}%`);
        }

        // Yield control periodically to prevent blocking
        if (i % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Sort alphabetically
      folders.sort();
      files.sort();

      // Process folders with memory management
      for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];
        const isLast = i === folders.length - 1 && files.length === 0;
        const connector = isLast ? '└── ' : '├── ';
        const newPrefix = prefix + (isLast ? '    ' : '│   ');

        lines.push(`${prefix}${connector}${showIcons ? '📁 ' : ''}${folder}/`);

        const folderPath = path.join(currentPath, folder);
        await this.generateTreeLines(
          folderPath,
          newPrefix,
          lines,
          depth + 1,
          maxDepth,
          showIcons,
          rootPath,
          progressCallback
        );

        // Yield control periodically
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Process files with memory management
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isLast = i === files.length - 1;
        const connector = isLast ? '└── ' : '├── ';

        // Get file icon based on extension
        const fileInfo = getFileTypeInfo(file);
        const icon = showIcons ? fileInfo.icon + ' ' : '';
        lines.push(`${prefix}${connector}${icon}${file}`);

        // Yield control periodically
        if (i % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } catch (error) {
      lines.push(`${prefix}└── ❌ Error reading directory: ${error}`);
    }
  }
}
