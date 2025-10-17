/**
 * Base interface for tree formatters
 * Implements Strategy pattern for different output formats
 *
 * @module formatters
 * @since 0.2.0
 */

import { FileTreeItem } from '../types';

/**
 * Format options for tree generation
 */
export interface FormatOptions {
  /** Whether to show file/folder icons */
  showIcons: boolean;
  /** Maximum depth to traverse */
  maxDepth: number;
  /** Root path being formatted */
  rootPath: string;
  /** Optional progress callback */
  progressCallback?: (message: string) => void;
}

/**
 * Result of formatting operation
 */
export interface FormatResult {
  /** Formatted content */
  content: string;
  /** File extension for output */
  extension: string;
  /** Language ID for syntax highlighting */
  languageId: string;
}

/**
 * Base interface for all tree formatters
 * Each formatter implements a different output format (Markdown, JSON, SVG, ASCII)
 */
export interface TreeFormatter {
  /**
   * Format a file tree into the desired output format
   *
   * @param items - Array of file tree items to format
   * @param options - Formatting options
   * @returns Formatted result with content and metadata
   */
  format(items: FileTreeItem[], options: FormatOptions): Promise<FormatResult>;

  /**
   * Get the file extension for this format
   *
   * @returns File extension (e.g., 'md', 'json', 'svg')
   */
  getExtension(): string;

  /**
   * Get the language ID for VS Code syntax highlighting
   *
   * @returns Language ID (e.g., 'markdown', 'json', 'xml')
   */
  getLanguageId(): string;

  /**
   * Get a human-readable name for this format
   *
   * @returns Format name (e.g., 'Markdown', 'JSON')
   */
  getName(): string;
}
