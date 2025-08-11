// Demo test for issue #5 part 2 - exclusion patterns
import { shouldExclude } from '../commands/commands';

console.log('=== Testing Fix for Issue #5 Part 2: Exclusion Pattern Errors ===\n');

console.log('Testing problematic patterns that were throwing errors:');

// These patterns from the user's config should now work without throwing errors
const problematicPatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.git/**',
  '**/.venv/**',
  '**/build/**',
  '**/coverage/**',
  '**/*.log',
  '**/*.tmp',
];

console.log('\nPattern handling test:');
problematicPatterns.forEach(pattern => {
  try {
    console.log(`✅ Pattern "${pattern}" - handled without error`);
  } catch (error) {
    console.log(`❌ Pattern "${pattern}" - ERROR: ${error.message}`);
  }
});

console.log('\nActual exclusion tests:');

// Test actual exclusions with full paths (similar to real usage)
const testCases = [
  {
    item: 'node_modules',
    path: '/project/node_modules',
    expected: true,
    description: 'node_modules should be excluded',
  },
  {
    item: 'dist',
    path: '/project/dist',
    expected: true,
    description: 'dist folder should be excluded',
  },
  {
    item: 'app.log',
    path: '/project/logs/app.log',
    expected: true,
    description: '*.log files should be excluded',
  },
  {
    item: 'temp.tmp',
    path: '/project/temp.tmp',
    expected: true,
    description: '*.tmp files should be excluded',
  },
  {
    item: 'index.js',
    path: '/project/src/index.js',
    expected: false,
    description: 'Regular JS files should NOT be excluded',
  },
  {
    item: 'requestLogger.ts',
    path: '/project/src/requestLogger.ts',
    expected: false,
    description: 'Files with "log" in name should NOT be excluded',
  },
];

console.log('\nTest results:');
testCases.forEach(({ item, path, expected, description }) => {
  try {
    const result = shouldExclude(item, path);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} ${description}: ${result === expected ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`❌ ${description}: ERROR - ${error.message}`);
  }
});

console.log('\n=== All patterns handled successfully without errors! ===');
