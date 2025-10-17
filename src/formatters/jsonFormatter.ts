/**
 * JSON formatter for file trees
 * Generates structured JSON output for programmatic use
 *
 * @module formatters
 * @since 0.2.0
 */

import * as path from 'path';
import { FileTreeItem } from '../types';
import { FormatOptions, FormatResult, TreeFormatter } from './treeFormatter.interface';

/**
 * Formats file trees as JSON
 * Perfect for APIs and data processing
 */
export class JSONFormatter implements TreeFormatter {
  getName(): string {
    return 'JSON';
  }

  getExtension(): string {
    return 'json';
  }

  getLanguageId(): string {
    return 'json';
  }

  async format(items: FileTreeItem[], options: FormatOptions): Promise<FormatResult> {
    const jsonOutput = {
      name: path.basename(options.rootPath),
      path: options.rootPath,
      type: 'directory',
      children: this.buildTreeData(items, options),
      metadata: {
        generated: new Date().toISOString(),
        generator: 'FileTree Pro Extension',
        version: '0.2.0',
        showIcons: options.showIcons,
        maxDepth: options.maxDepth,
      },
    };

    return {
      content: JSON.stringify(jsonOutput, null, 2),
      extension: this.getExtension(),
      languageId: this.getLanguageId(),
    };
  }

  /**
   * Build tree data structure from items
   */
  private buildTreeData(items: FileTreeItem[], options: FormatOptions): any[] {
    return items.map(item => {
      const node: any = {
        name: item.name,
        type: item.type,
      };

      // Add icon if showIcons is enabled
      if (options.showIcons) {
        node.icon = item.type === 'folder' ? '📁' : this.getFileIcon(item.name);
      }

      if (item.size !== undefined) {
        node.size = item.size;
      }

      if (item.modifiedDate) {
        node.modified = item.modifiedDate.toISOString();
      }

      if (item.children && item.children.length > 0) {
        node.children = this.buildTreeData(item.children, options);
      }

      return node;
    });
  }

  /**
   * Get icon for file based on extension
   */
  private getFileIcon(filename: string): string {
    const ext = path.extname(filename).toLowerCase();

    // Check for specific filenames first
    const basename = path.basename(filename).toLowerCase();
    if (basename === 'package.json') return '📦';
    if (basename === 'dockerfile' || basename === '.dockerignore') return '🐳';
    if (basename.startsWith('.git')) return '📁';

    // Check extensions
    const iconMap: Record<string, string> = {
      // JavaScript/TypeScript
      '.js': '📜',
      '.ts': '📘',
      '.jsx': '⚛️',
      '.tsx': '⚛️',

      // Python
      '.py': '🐍',

      // Web
      '.html': '🌐',
      '.css': '🎨',
      '.scss': '🎨',

      // Config
      '.json': '⚙️',
      '.yaml': '⚙️',
      '.yml': '⚙️',
      '.toml': '⚙️',

      // Docs
      '.md': '📝',
      '.txt': '📄',
      '.pdf': '📕',

      // Images
      '.png': '🖼️',
      '.jpg': '🖼️',
      '.svg': '🖼️',
      '.gif': '🖼️',
    };

    return iconMap[ext] || '📄';
  }
}
