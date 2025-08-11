// Test file to demonstrate the fixes for issue #5
import { shouldExclude } from '../commands/commands';

console.log('=== Testing Auto-Hidden Flag Fixes ===\n');

// Test cases from the GitHub issue
const testFiles = [
  'requestLogger.ts',
  'pnpm-lock.yaml',
  '.env',
  '.gitignore',
  '.prettierignore',
  '.lintstagedrc.json',
];

console.log('Files that should NOT be auto-hidden:');
testFiles.forEach(file => {
  const isExcluded = shouldExclude(file);
  console.log(`${file}: ${isExcluded ? '🚫 (auto-hidden)' : '✅ (visible)'}`);
});

console.log('\nFiles that SHOULD be auto-hidden:');
const shouldBeHidden = ['error.log', 'node_modules', '.git', 'dist', 'build', 'coverage'];

shouldBeHidden.forEach(file => {
  const isExcluded = shouldExclude(file);
  console.log(`${file}: ${isExcluded ? '🚫 (auto-hidden)' : '❌ (ERROR: should be hidden)'}`);
});

console.log('\nWildcard pattern tests:');
const wildcardTests = [
  'app.log', // Should be hidden (*.log)
  'logger.ts', // Should NOT be hidden (contains "log" but not ends with .log)
  'blogPost.md', // Should NOT be hidden (contains "log" but not ends with .log)
  'debug.log', // Should be hidden (*.log)
];

wildcardTests.forEach(file => {
  const isExcluded = shouldExclude(file);
  const expected = file.endsWith('.log');
  const status = isExcluded === expected ? '✅' : '❌ ERROR';
  console.log(`${file}: ${isExcluded ? '🚫 (auto-hidden)' : '✅ (visible)'} ${status}`);
});
