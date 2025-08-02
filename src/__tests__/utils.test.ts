import {
  formatDate,
  formatFileSize,
  formatRelativeDate,
  getDisplayName,
  getFileExtension,
  getFileIcon,
  getFileTypeInfo,
  isHiddenFile,
  isTextFile,
  sanitizeFileName,
} from '../utils/fileUtils';

describe('File Utils', () => {
  describe('getFileTypeInfo', () => {
    it('should identify TypeScript files', () => {
      const info = getFileTypeInfo('main.ts');
      expect(info.type).toBe('code');
      expect(info.extensions).toContain('.ts');
      expect(info.icon).toBeDefined();
    });

    it('should identify JavaScript files', () => {
      const info = getFileTypeInfo('app.js');
      expect(info.type).toBe('code');
      expect(info.extensions).toContain('.js');
    });

    it('should identify Python files', () => {
      const info = getFileTypeInfo('main.py');
      expect(info.type).toBe('code');
      expect(info.extensions).toContain('.py');
    });

    it('should identify Java files', () => {
      const info = getFileTypeInfo('Main.java');
      expect(info.type).toBe('code');
      expect(info.extensions).toContain('.java');
    });

    it('should identify C++ files', () => {
      const info = getFileTypeInfo('main.cpp');
      expect(info.type).toBe('code');
      expect(info.extensions).toContain('.cpp');
    });

    it('should identify Go files', () => {
      const info = getFileTypeInfo('main.go');
      expect(info.type).toBe('code');
      expect(info.extensions).toContain('.go');
    });

    it('should identify Ruby files', () => {
      const info = getFileTypeInfo('app.rb');
      expect(info.type).toBe('code');
      expect(info.extensions).toContain('.rb');
    });

    it('should return default for unknown files', () => {
      const info = getFileTypeInfo('unknown.xyz');
      expect(info.type).toBe('unknown');
      expect(info.icon).toBeDefined();
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(512)).toContain('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toContain('1 KiB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toContain('1 MiB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toContain('1 GiB');
    });

    it('should handle zero size', () => {
      expect(formatFileSize(0)).toContain('0 B');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2022-01-01T12:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan 01, 2022/);
    });

    it('should handle invalid date', () => {
      const formatted = formatDate(new Date('invalid'));
      expect(formatted).toBe('Invalid date');
    });
  });

  describe('formatRelativeDate', () => {
    it('should show "a few seconds ago" for recent dates', () => {
      const recent = new Date();
      const formatted = formatRelativeDate(recent);
      expect(formatted).toContain('a few seconds ago');
    });

    it('should show "a day ago" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const formatted = formatRelativeDate(yesterday);
      expect(formatted).toContain('a day ago');
    });

    it('should show days ago for older dates', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5);
      const formatted = formatRelativeDate(oldDate);
      expect(formatted).toContain('5 days ago');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('file.txt')).toBe('.txt');
      expect(getFileExtension('script.js')).toBe('.js');
      expect(getFileExtension('main.ts')).toBe('.ts');
    });

    it('should handle files without extension', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('Dockerfile')).toBe('');
    });

    it('should handle hidden files', () => {
      expect(getFileExtension('.env')).toBe('.env');
      expect(getFileExtension('.gitignore')).toBe('.gitignore');
    });

    it('should handle multiple dots', () => {
      expect(getFileExtension('file.min.js')).toBe('.js');
      expect(getFileExtension('config.prod.json')).toBe('.json');
    });
  });

  describe('isTextFile', () => {
    it('should identify text files', () => {
      expect(isTextFile('file.txt')).toBe(true);
      expect(isTextFile('script.js')).toBe(true);
      expect(isTextFile('main.ts')).toBe(true);
      expect(isTextFile('app.py')).toBe(true);
      expect(isTextFile('config.json')).toBe(true);
      expect(isTextFile('README.md')).toBe(true);
    });

    it('should identify non-text files', () => {
      expect(isTextFile('image.png')).toBe(false);
      expect(isTextFile('photo.jpg')).toBe(false);
      expect(isTextFile('video.mp4')).toBe(false);
      expect(isTextFile('archive.zip')).toBe(false);
    });
  });

  describe('getFileIcon', () => {
    it('should return appropriate icons for different file types', () => {
      expect(getFileIcon('script.js')).toBe('📄');
      expect(getFileIcon('image.png')).toBe('🖼️');
      expect(getFileIcon('video.mp4')).toBe('🎬');
      expect(getFileIcon('audio.mp3')).toBe('🎵');
      expect(getFileIcon('archive.zip')).toBe('📦');
      expect(getFileIcon('document.pdf')).toBe('📕');
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove invalid characters', () => {
      expect(sanitizeFileName('file<name>.txt')).toBe('file_name_.txt');
      expect(sanitizeFileName('file:name.txt')).toBe('file_name.txt');
      expect(sanitizeFileName('file|name.txt')).toBe('file_name.txt');
    });

    it('should handle special characters', () => {
      expect(sanitizeFileName('file*name.txt')).toBe('file_name.txt');
      expect(sanitizeFileName('file?name.txt')).toBe('file_name.txt');
      expect(sanitizeFileName('file"name".txt')).toBe('file_name_.txt');
    });

    it('should preserve valid characters', () => {
      expect(sanitizeFileName('valid-file_name.txt')).toBe('valid-file_name.txt');
      expect(sanitizeFileName('file123.txt')).toBe('file123.txt');
    });
  });

  describe('isHiddenFile', () => {
    it('should identify hidden files', () => {
      expect(isHiddenFile('.env')).toBe(true);
      expect(isHiddenFile('.gitignore')).toBe(true);
      expect(isHiddenFile('.vscode')).toBe(true);
    });

    it('should identify non-hidden files', () => {
      expect(isHiddenFile('file.txt')).toBe(false);
      expect(isHiddenFile('README.md')).toBe(false);
      expect(isHiddenFile('package.json')).toBe(false);
    });
  });

  describe('getDisplayName', () => {
    it('should return filename for regular files', () => {
      expect(getDisplayName('file.txt')).toBe('file.txt');
      expect(getDisplayName('src/main.ts')).toBe('main.ts');
    });

    it('should handle files without extension', () => {
      expect(getDisplayName('README')).toBe('README');
      expect(getDisplayName('Dockerfile')).toBe('Dockerfile');
    });

    it('should handle hidden files', () => {
      expect(getDisplayName('.env')).toBe('.env');
      expect(getDisplayName('.gitignore')).toBe('.gitignore');
    });

    it('should handle special files', () => {
      expect(getDisplayName('package.json')).toBe('package.json');
      expect(getDisplayName('tsconfig.json')).toBe('tsconfig.json');
    });
  });
});
