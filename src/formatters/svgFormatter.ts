/**
 * SVG formatter for file trees
 * Generates scalable vector graphics for visual presentation
 *
 * @module formatters
 * @since 0.2.0
 */

import * as path from 'path';
import { FileTreeItem } from '../types';
import { getFileTypeInfo } from '../utils/fileUtils';
import { FormatOptions, FormatResult, TreeFormatter } from './treeFormatter.interface';

/**
 * Formats file trees as SVG diagrams
 * Perfect for documentation and presentations
 */
export class SVGFormatter implements TreeFormatter {
  getName(): string {
    return 'SVG';
  }

  getExtension(): string {
    return 'svg';
  }

  getLanguageId(): string {
    return 'xml';
  }

  async format(items: FileTreeItem[], options: FormatOptions): Promise<FormatResult> {
    // Calculate dimensions based on content
    const nodeCount = this.countNodes(items);
    const svgWidth = 1000;
    const svgHeight = Math.max(800, nodeCount * 25 + 100);

    let svgContent = this.generateHeader(svgWidth, svgHeight, options);
    let yOffset = 80;

    // Render all nodes
    for (const item of items) {
      yOffset = this.renderNode(item, 30, 0, yOffset, options, svgContent);
      yOffset += 25;
    }

    svgContent += '\n</svg>';

    return {
      content: svgContent,
      extension: this.getExtension(),
      languageId: this.getLanguageId(),
    };
  }

  /**
   * Generate SVG header with styles
   */
  private generateHeader(width: number, height: number, options: FormatOptions): string {
    const rootName = path.basename(options.rootPath);
    const timestamp = new Date().toLocaleString();

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold; fill: #2c3e50; }
      .subtitle { font-family: 'Arial', sans-serif; font-size: 12px; fill: #7f8c8d; }
      .folder-text { font-family: 'Consolas', 'Courier New', monospace; font-size: 14px; fill: #27ae60; font-weight: bold; }
      .file-text { font-family: 'Consolas', 'Courier New', monospace; font-size: 14px; fill: #3498db; }
      .icon { font-family: 'Arial', sans-serif; font-size: 16px; }
      .line { stroke: #bdc3c7; stroke-width: 1.5; }
      .background { fill: #f8f9fa; }
      .header-bg { fill: #ecf0f1; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" class="background"/>

  <!-- Header -->
  <rect x="0" y="0" width="${width}" height="60" class="header-bg"/>
  <text x="20" y="25" class="title">📁 File Tree: ${rootName}</text>
  <text x="20" y="45" class="subtitle">Generated: ${timestamp} | FileTree Pro Extension</text>

  <!-- Tree Structure -->`;
  }

  /**
   * Render a single node and its children
   */
  private renderNode(
    item: FileTreeItem,
    x: number,
    level: number,
    yOffset: number,
    options: FormatOptions,
    svgContent: string
  ): number {
    let content = svgContent;
    const fileInfo = getFileTypeInfo(item.name);
    const icon = options.showIcons ? fileInfo.icon : '';
    const displayName = item.name + (item.type === 'folder' ? '/' : '');
    const textClass = item.type === 'folder' ? 'folder-text' : 'file-text';

    // Draw connecting lines
    if (level > 0) {
      content += `\n    <line x1="${x - 15}" y1="${yOffset - 10}" x2="${x - 15}" y2="${yOffset}" class="line"/>`;
    }
    content += `\n    <line x1="${x - 15}" y1="${yOffset}" x2="${x - 5}" y2="${yOffset}" class="line"/>`;

    // Draw icon and text
    if (options.showIcons && icon) {
      content += `\n    <text x="${x}" y="${yOffset + 5}" class="icon">${icon}</text>`;
      content += `\n    <text x="${x + 25}" y="${yOffset + 5}" class="${textClass}">${displayName}</text>`;
    } else {
      content += `\n    <text x="${x}" y="${yOffset + 5}" class="${textClass}">${displayName}</text>`;
    }

    // Render children
    if (item.children && item.children.length > 0) {
      yOffset += 30;
      for (const child of item.children) {
        yOffset = this.renderNode(child, x + 30, level + 1, yOffset, options, content);
        yOffset += 25;
      }
    }

    return yOffset + 10;
  }

  /**
   * Count total nodes for dimension calculation
   */
  private countNodes(items: FileTreeItem[]): number {
    let count = 0;
    for (const item of items) {
      count++;
      if (item.children && item.children.length > 0) {
        count += this.countNodes(item.children);
      }
    }
    return count;
  }
}
