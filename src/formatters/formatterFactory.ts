/**
 * Formatter Factory - Creates formatters using Factory Pattern
 * Centralizes formatter instantiation and management
 *
 * @module formatters
 * @since 0.2.0
 */

import { ASCIIFormatter } from './asciiFormatter';
import { JSONFormatter } from './jsonFormatter';
import { MarkdownFormatter } from './markdownFormatter';
import { SVGFormatter } from './svgFormatter';
import { TreeFormatter } from './treeFormatter.interface';

/**
 * Available formatter types
 */
export type FormatterType = 'markdown' | 'json' | 'svg' | 'ascii';

/**
 * Factory for creating tree formatters
 * Implements Factory Pattern for clean instantiation
 */
export class FormatterFactory {
  private static formatters: Map<FormatterType, TreeFormatter> = new Map<
    FormatterType,
    TreeFormatter
  >([
    ['markdown', new MarkdownFormatter()],
    ['json', new JSONFormatter()],
    ['svg', new SVGFormatter()],
    ['ascii', new ASCIIFormatter()],
  ]);

  /**
   * Create formatter by type
   * @param type - The formatter type to create
   * @returns TreeFormatter instance
   * @throws Error if formatter type not found
   */
  static createFormatter(type: FormatterType): TreeFormatter {
    const formatter = this.formatters.get(type);
    if (!formatter) {
      throw new Error(`Unknown formatter type: ${type}`);
    }
    return formatter;
  }

  /**
   * Get all available formatter types
   */
  static getAvailableTypes(): FormatterType[] {
    return Array.from(this.formatters.keys());
  }

  /**
   * Get all formatters
   */
  static getAllFormatters(): Map<FormatterType, TreeFormatter> {
    return new Map(this.formatters);
  }

  /**
   * Check if formatter type exists
   */
  static hasFormatter(type: string): type is FormatterType {
    return this.formatters.has(type as FormatterType);
  }
}
