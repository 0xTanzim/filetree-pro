/**
 * Tests for security utilities
 * Validates path validation, pattern validation, and file size checks
 *
 * @author FileTree Pro Team
 * @since 0.2.0
 */

import {
  MAX_FILE_SIZE,
  MAX_PATH_DEPTH,
  MAX_PATTERN_LENGTH,
  sanitizeFilename,
  validateExclusionPatterns,
  validateFileSize,
  validatePath,
  validatePattern,
} from '../utils/securityUtils';

describe('Security Utils', () => {
  describe('validatePath', () => {
    test('should accept valid paths', () => {
      const result = validatePath('/home/user/project/file.ts');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject empty paths', () => {
      const result = validatePath('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    test('should reject paths with null bytes', () => {
      const result = validatePath('/home/user\0/file.ts');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('null bytes');
    });

    test('should reject path traversal attempts', () => {
      const result = validatePath('/home/user/../../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('traversal');
    });

    test('should reject excessive path depth', () => {
      const deepPath = '/' + 'a/'.repeat(MAX_PATH_DEPTH + 1);
      const result = validatePath(deepPath);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('depth exceeds');
    });

    test('should validate path against base path', () => {
      const result = validatePath('/home/user/../etc/passwd', '/home/user');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('traversal');
    });

    test('should accept path within base path', () => {
      const result = validatePath('/home/user/project/file.ts', '/home/user');
      expect(result.valid).toBe(true);
    });

    test('should reject excessively long paths', () => {
      const longPath = '/' + 'a'.repeat(MAX_PATH_DEPTH * 300);
      const result = validatePath(longPath);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });
  });

  describe('validatePattern', () => {
    test('should accept valid glob patterns', () => {
      expect(validatePattern('*.ts').valid).toBe(true);
      expect(validatePattern('**/*.js').valid).toBe(true);
      expect(validatePattern('node_modules').valid).toBe(true);
    });

    test('should reject empty patterns', () => {
      const result = validatePattern('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    test('should reject excessively long patterns', () => {
      const longPattern = 'a'.repeat(MAX_PATTERN_LENGTH + 1);
      const result = validatePattern(longPattern);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    test('should reject nested quantifiers (ReDoS risk)', () => {
      const result = validatePattern('(a+)+');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('nested quantifiers');
    });

    test('should reject overlapping alternatives (ReDoS risk)', () => {
      const result = validatePattern('(a|ab)+');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('overlapping alternatives');
    });

    test('should reject excessive wildcards', () => {
      const result = validatePattern('*'.repeat(15));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too many wildcards');
    });

    test('should accept reasonable number of wildcards', () => {
      const result = validatePattern('**/*.{ts,js,tsx,jsx}');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    test('should accept files within size limit', () => {
      const result = validateFileSize(1024 * 1024); // 1MB
      expect(result.valid).toBe(true);
    });

    test('should reject files exceeding size limit', () => {
      const result = validateFileSize(MAX_FILE_SIZE + 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    test('should reject negative file sizes', () => {
      const result = validateFileSize(-1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be negative');
    });

    test('should reject NaN file sizes', () => {
      const result = validateFileSize(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('finite number');
    });

    test('should reject Infinity file sizes', () => {
      const result = validateFileSize(Infinity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('finite number');
    });

    test('should accept custom max size', () => {
      const customMax = 1024 * 1024; // 1MB
      const result = validateFileSize(customMax + 1, customMax);
      expect(result.valid).toBe(false);
    });

    test('should accept zero-size files', () => {
      const result = validateFileSize(0);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateExclusionPatterns', () => {
    test('should accept valid pattern arrays', () => {
      const result = validateExclusionPatterns(['*.log', 'node_modules', 'dist']);
      expect(result.valid).toBe(true);
    });

    test('should reject non-array input', () => {
      const result = validateExclusionPatterns('not-an-array' as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an array');
    });

    test('should reject excessive number of patterns', () => {
      const tooMany = Array(1001).fill('*.log');
      const result = validateExclusionPatterns(tooMany);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Too many');
    });

    test('should reject non-string patterns', () => {
      const result = validateExclusionPatterns([123 as any, '*.log']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not a string');
    });

    test('should reject invalid patterns in array', () => {
      const result = validateExclusionPatterns(['*.log', '(a+)+', 'dist']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('nested quantifiers');
    });

    test('should accept empty array', () => {
      const result = validateExclusionPatterns([]);
      expect(result.valid).toBe(true);
    });
  });

  describe('sanitizeFilename', () => {
    test('should remove dangerous characters', () => {
      const result = sanitizeFilename('my<file>name.txt');
      expect(result).toBe('my_file_name.txt');
    });

    test('should remove null bytes', () => {
      const result = sanitizeFilename('file\0name.txt');
      expect(result).toBe('filename.txt');
    });

    test('should trim leading/trailing dots', () => {
      const result = sanitizeFilename('..filename.txt.');
      expect(result).toBe('filename.txt');
    });

    test('should return untitled for empty result', () => {
      const result = sanitizeFilename('<<>>');
      expect(result).toBe('untitled');
    });

    test('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
      expect(result.endsWith('.txt')).toBe(true);
    });

    test('should preserve valid filenames', () => {
      const result = sanitizeFilename('valid-file_name.123.txt');
      expect(result).toBe('valid-file_name.123.txt');
    });

    test('should remove control characters', () => {
      const result = sanitizeFilename('file\x01\x02name.txt');
      expect(result).toBe('file__name.txt');
    });
  });
});
