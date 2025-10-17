/**
 * Security utilities for path validation, pattern validation, and file size checks.
 * Prevents path traversal, ReDoS attacks, and resource exhaustion.
 *
 * @module securityUtils
 * @author FileTree Pro Team
 * @since 0.2.0
 */

import * as path from 'path';

/**
 * Maximum file size for processing (50MB)
 * Prevents memory exhaustion from processing very large files
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Maximum pattern length to prevent ReDoS attacks
 * Patterns longer than this are likely malicious or poorly constructed
 */
export const MAX_PATTERN_LENGTH = 1000;

/**
 * Maximum path depth to prevent directory traversal attacks
 * Unix systems typically limit paths to 4096 chars, this is a safe subset
 */
export const MAX_PATH_DEPTH = 100;

/**
 * Validation result with success status and optional error message
 */
export interface ValidationResult {
  /** Whether the validation passed */
  readonly valid: boolean;
  /** Human-readable error message if validation failed */
  readonly error?: string;
}

/**
 * Validates a file system path for security issues.
 * Checks for:
 * - Path traversal attempts (../, ..\, etc.)
 * - Absolute path escapes
 * - Null bytes and special characters
 * - Excessive path depth
 *
 * Time Complexity: O(n) where n is path length
 * Space Complexity: O(n) for normalized path
 *
 * @param targetPath - The file system path to validate
 * @param basePath - Optional base path to validate against
 * @returns Validation result with success status and optional error
 *
 * @example
 * ```typescript
 * const result = validatePath('/home/user/project/file.ts', '/home/user/project');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validatePath(targetPath: string, basePath?: string): ValidationResult {
  // Check for null or empty path
  if (!targetPath || targetPath.trim().length === 0) {
    return { valid: false, error: 'Path cannot be empty' };
  }

  // Check for null bytes (security risk in some file systems)
  if (targetPath.includes('\0')) {
    return { valid: false, error: 'Path contains null bytes' };
  }

  // Check for excessive length (possible DoS)
  if (targetPath.length > MAX_PATH_DEPTH * 255) {
    // Typical max filename is 255 chars
    return { valid: false, error: 'Path exceeds maximum length' };
  }

  // Check for path traversal attempts BEFORE normalization
  if (targetPath.includes('..')) {
    return { valid: false, error: 'Path contains directory traversal sequence (..)' };
  }

  // Normalize the path to resolve any ., or // sequences
  const normalizedPath = path.normalize(targetPath);

  // Check for path segments after normalization
  const pathSegments = normalizedPath.split(path.sep);

  // Check depth to prevent extremely deep directory structures
  if (pathSegments.length > MAX_PATH_DEPTH) {
    return { valid: false, error: `Path depth exceeds maximum (${MAX_PATH_DEPTH})` };
  }

  // If basePath is provided, ensure targetPath is within basePath
  if (basePath) {
    const normalizedBase = path.normalize(basePath);
    const resolvedPath = path.resolve(normalizedBase, normalizedPath);

    // Ensure resolved path starts with base path (prevents escapes)
    if (!resolvedPath.startsWith(normalizedBase)) {
      return { valid: false, error: 'Path attempts to escape base directory' };
    }
  }

  return { valid: true };
}

/**
 * Validates a glob pattern for ReDoS (Regular Expression Denial of Service) risks.
 * Checks for:
 * - Excessive pattern length
 * - Nested quantifiers (e.g., (a+)+)
 * - Catastrophic backtracking patterns
 *
 * Time Complexity: O(n) where n is pattern length
 * Space Complexity: O(1)
 *
 * @param pattern - The glob pattern to validate
 * @returns Validation result with success status and optional error
 *
 * @example
 * ```typescript
 * const result = validatePattern('*.ts');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validatePattern(pattern: string): ValidationResult {
  // Check for null or empty pattern
  if (!pattern || pattern.trim().length === 0) {
    return { valid: false, error: 'Pattern cannot be empty' };
  }

  // Check pattern length to prevent extremely complex patterns
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return { valid: false, error: `Pattern exceeds maximum length (${MAX_PATTERN_LENGTH})` };
  }

  // Check for nested quantifiers that can cause ReDoS
  // Patterns like (a+)+, (a*)+, (a{1,5})+, etc.
  const nestedQuantifierRegex = /\([^)]*[*+{][^)]*\)[*+{]/g;
  if (nestedQuantifierRegex.test(pattern)) {
    return { valid: false, error: 'Pattern contains nested quantifiers (ReDoS risk)' };
  }

  // Check for alternation with overlapping patterns (catastrophic backtracking)
  // Patterns like (a|a)+ or (a|ab)+
  const alternationRegex = /\([^)|]+\|[^)]+\)[*+{]/g;
  const matches = pattern.match(alternationRegex);
  if (matches) {
    for (const match of matches) {
      // Extract alternatives
      const alternatives = match
        .slice(1, -2) // Remove ( and )+
        .split('|');

      // Check if any alternative is a prefix of another
      for (let i = 0; i < alternatives.length; i++) {
        for (let j = i + 1; j < alternatives.length; j++) {
          if (
            alternatives[i].startsWith(alternatives[j]) ||
            alternatives[j].startsWith(alternatives[i])
          ) {
            return {
              valid: false,
              error: 'Pattern contains overlapping alternatives (ReDoS risk)',
            };
          }
        }
      }
    }
  }

  // Check for excessive use of wildcards
  const wildcardCount = (pattern.match(/\*/g) || []).length;
  if (wildcardCount > 10) {
    return { valid: false, error: 'Pattern contains too many wildcards' };
  }

  return { valid: true };
}

/**
 * Validates a file size against maximum allowed size.
 * Prevents memory exhaustion from processing very large files.
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @param fileSize - The file size in bytes
 * @param maxSize - Optional custom maximum size (defaults to MAX_FILE_SIZE)
 * @returns Validation result with success status and optional error
 *
 * @example
 * ```typescript
 * const result = validateFileSize(1024 * 1024); // 1MB
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number = MAX_FILE_SIZE
): ValidationResult {
  // Check for negative size
  if (fileSize < 0) {
    return { valid: false, error: 'File size cannot be negative' };
  }

  // Check for NaN or Infinity
  if (!Number.isFinite(fileSize)) {
    return { valid: false, error: 'File size must be a finite number' };
  }

  // Check against maximum
  if (fileSize > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum (${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes a filename by removing potentially dangerous characters.
 * Useful for generating safe output filenames.
 *
 * Time Complexity: O(n) where n is filename length
 * Space Complexity: O(n) for sanitized string
 *
 * @param filename - The filename to sanitize
 * @returns Sanitized filename safe for file system operations
 *
 * @example
 * ```typescript
 * const safe = sanitizeFilename('my<file>name.txt'); // Returns: 'my_file_name.txt'
 * ```
 */
export function sanitizeFilename(filename: string): string {
  // Remove null bytes
  let sanitized = filename.replace(/\0/g, '');

  // Replace dangerous characters with underscores
  // Dangerous: < > : " / \ | ? * and control characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

  // Trim whitespace and dots from start/end (Windows requirement)
  sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');

  // Ensure filename is not empty or only underscores after sanitization
  if (sanitized.length === 0 || /^_+$/.test(sanitized)) {
    sanitized = 'untitled';
  }

  // Limit length to safe maximum (255 is common filesystem limit)
  if (sanitized.length > 255) {
    const extension = path.extname(sanitized);
    const basename = path.basename(sanitized, extension);
    sanitized = basename.slice(0, 255 - extension.length) + extension;
  }

  return sanitized;
}

/**
 * Validates an array of exclusion patterns for security issues.
 * Checks each pattern and returns the first invalid result.
 *
 * Time Complexity: O(n*m) where n is number of patterns, m is average pattern length
 * Space Complexity: O(1)
 *
 * @param patterns - Array of glob patterns to validate
 * @returns Validation result with success status and optional error
 *
 * @example
 * ```typescript
 * const result = validateExclusionPatterns(['*.log', 'node_modules', 'dist']);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateExclusionPatterns(patterns: string[]): ValidationResult {
  // Check for null or empty array
  if (!Array.isArray(patterns)) {
    return { valid: false, error: 'Patterns must be an array' };
  }

  // Check for excessive number of patterns (potential DoS)
  if (patterns.length > 1000) {
    return { valid: false, error: 'Too many exclusion patterns (max: 1000)' };
  }

  // Validate each pattern
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];

    // Check pattern type
    if (typeof pattern !== 'string') {
      return {
        valid: false,
        error: `Pattern at index ${i} is not a string (type: ${typeof pattern})`,
      };
    }

    // Validate pattern for ReDoS
    const result = validatePattern(pattern);
    if (!result.valid) {
      return {
        valid: false,
        error: `Pattern at index ${i} ('${pattern}'): ${result.error}`,
      };
    }
  }

  return { valid: true };
}
