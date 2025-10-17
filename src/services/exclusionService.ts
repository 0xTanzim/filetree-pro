/**
 * Exclusion Service - Handles file/folder exclusion logic
 * Manages gitignore parsing, glob patterns, and exclusion rules
 *
 * @module services
 * @since 0.3.0
 */

import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Service for handling file and folder exclusions
 * Implements Single Responsibility Principle
 */
export class ExclusionService {
  private gitignoreCache = new Map<string, string[]>();
  private timers: NodeJS.Timeout[] = []; // Track timers for cleanup

  /**
   * Read and parse .gitignore file
   * @param rootPath - Root directory path
   * @returns Array of gitignore patterns
   */
  async readGitignore(rootPath: string): Promise<string[]> {
    // Check cache first
    if (this.gitignoreCache.has(rootPath)) {
      return this.gitignoreCache.get(rootPath)!;
    }

    const gitignorePath = path.join(rootPath, '.gitignore');
    try {
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(gitignorePath));
      const patterns = content
        .toString()
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.trim());

      // Cache for 5 minutes - ✅ Track timer
      this.gitignoreCache.set(rootPath, patterns);
      const timer = setTimeout(() => this.gitignoreCache.delete(rootPath), 5 * 60 * 1000);
      this.timers.push(timer); // Track for cleanup

      return patterns;
    } catch {
      return [];
    }
  }

  /**
   * Convert glob pattern to RegExp
   * Supports *, **, ? wildcards
   *
   * @param pattern - Glob pattern (e.g., "*.log", "**​/node_modules/**")
   * @returns RegExp for matching
   *
   * @example
   * ```typescript
   * const regex = globToRegex("*.log");
   * regex.test("error.log"); // true
   * ```
   */
  globToRegex(pattern: string): RegExp {
    // Handle file extension patterns FIRST (before escaping)
    if (pattern.startsWith('*.') && !pattern.includes('/')) {
      const extension = pattern.slice(1); // Remove the *
      const escapedExt = extension.replace(/\./g, '\\.');
      return new RegExp(`${escapedExt}$`, 'i');
    }

    // Handle directory patterns ending with /
    if (pattern.endsWith('/')) {
      const dirName = pattern.slice(0, -1);
      const escapedDirName = dirName.replace(/[.+^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|/)${escapedDirName}(/|$)`, 'i');
    }

    // Escape special regex characters except for our glob patterns
    let regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\\\*/g, '__STAR__') // Temporarily replace escaped asterisks
      .replace(/\*\*/g, '.*') // ** means match any path segment(s)
      .replace(/__STAR__/g, '[^/]*') // * means match any characters except path separator
      .replace(/\\\?/g, '.'); // ? means match any single character

    // Anchor patterns appropriately
    if (!pattern.includes('*') && !pattern.includes('/')) {
      // Exact name match
      regexPattern = `(^|/)${regexPattern}(/|$)`;
    } else if (pattern.includes('**/')) {
      // Double star patterns
      regexPattern = `(^|/)${regexPattern}(/|$)`;
    }

    return new RegExp(regexPattern, 'i');
  }

  /**
   * Get default exclusion patterns
   */
  private getDefaultExcludePatterns(): string[] {
    return [
      // Build and dependency folders
      'node_modules',
      'dist',
      'build',
      'out',
      'target',
      'bin',
      'obj',
      '.next',
      '.nuxt',
      '.output',
      'coverage',
      'coverage.lcov',
      '.nyc_output',
      'bower_components',
      'jspm_packages',

      // Version control
      '.git',
      '.svn',
      '.hg',
      '.bzr',

      // IDE and editor folders
      '.vscode',
      '.idea',
      '.vs',
      '.cursor',
      '.atom',
      '.sublime-project',
      '.sublime-workspace',

      // Environment files
      '.env.local',
      '.env.production',
      '.env.development',
      '.env.test',
      'venv',
      '.venv',
      'env',
      '.python-version',
      '.ruby-version',
      '.node-version',

      // OS generated
      '.DS_Store',
      'Thumbs.db',
      '.Trash',
      'desktop.ini',
      '$RECYCLE.BIN',

      // Logs and temp files
      '*.log',
      '*.tmp',
      '*.cache',
      '*.pyc',
      '__pycache__',
      '*.swp',
      '*.swo',
      '*~',

      // Package manager lock files
      'composer.lock',
      'Gemfile.lock',
      'Pipfile.lock',
      'mix.lock',

      // Build artifacts
      '*.min.js',
      '*.min.css',
      '*.map',
      '*.bundle.js',
      '*.chunk.js',

      // Generated/config files
      '.eslintcache',
      '.babelrc',
      '.babelrc.js',
      'tsconfig.build.json',
      'karma.conf.js',
    ];
  }

  /**
   * Check if item should be excluded
   *
   * @param item - Item name
   * @param fullPath - Full path (optional)
   * @param rootPath - Root path (optional)
   * @returns true if should be excluded
   */
  shouldExclude(item: string, fullPath?: string, rootPath?: string): boolean {
    // Get user-defined exclusions from settings
    const config = vscode.workspace.getConfiguration('filetree-pro');
    const userExclusions = config.get<string[]>('exclude', []);
    const respectGitignore = config.get<boolean>('respectGitignore', true);

    // Use CACHED .gitignore patterns (pre-loaded async)
    let gitignorePatterns: string[] = [];
    if (respectGitignore && rootPath && this.gitignoreCache.has(rootPath)) {
      gitignorePatterns = this.gitignoreCache.get(rootPath)!;
    }

    // Combine all exclusion patterns
    const excludePatterns = [
      ...this.getDefaultExcludePatterns(),
      ...userExclusions,
      ...gitignorePatterns,
    ];

    const itemLower = item.toLowerCase();
    const pathToCheck = fullPath || item;
    const normalizedPath = pathToCheck.replace(/\\/g, '/');

    // Check exact matches (case-insensitive) - for simple patterns
    if (
      excludePatterns.some(pattern => {
        // Skip glob patterns for exact match check
        if (pattern.includes('*') || pattern.includes('/')) {
          return false;
        }
        // For exact name matching, only match complete names
        return pattern.toLowerCase() === itemLower;
      })
    ) {
      return true;
    }

    // Check wildcard and glob patterns
    for (const pattern of excludePatterns) {
      if (pattern.includes('*') || pattern.includes('/')) {
        try {
          // Handle file extension patterns like *.log, *.tmp
          if (pattern.startsWith('*.') && !pattern.includes('/')) {
            const extension = pattern.substring(1);
            if (item.toLowerCase().endsWith(extension.toLowerCase())) {
              return true;
            }
          } else {
            // Handle complex glob patterns
            const regex = this.globToRegex(pattern);
            if (regex.test(normalizedPath) || regex.test(item)) {
              return true;
            }
          }
        } catch (error) {
          console.warn(`Invalid exclusion pattern: ${pattern}`, error);
          continue;
        }
      }
    }

    // Check for common build/artifact patterns (exact matches)
    if (
      itemLower === 'build' ||
      itemLower === 'dist' ||
      itemLower === 'cache' ||
      itemLower === 'temp' ||
      itemLower === 'tmp'
    ) {
      return true;
    }

    return false;
  }

  /**
   * Clear gitignore cache
   */
  clearCache(): void {
    this.gitignoreCache.clear();
  }

  /**
   * ✅ Cleanup resources - clear timers and cache
   */
  dispose(): void {
    // Clear all running timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];

    // Clear cache
    this.gitignoreCache.clear();
  }
}
