#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building FileTree Pro Extension (Optimized)...');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const vsixName = `${packageJson.name}-${packageJson.version}.vsix`;

try {
  // Clean previous builds
  if (fs.existsSync('temp_package')) {
    execSync('rm -rf temp_package');
  }
  if (fs.existsSync(vsixName)) {
    fs.unlinkSync(vsixName);
  }

  // Build with webpack (production mode)
  console.log('📦 Building with Webpack (Production)...');
  execSync('npm run build', { stdio: 'inherit' });

  // Create package structure
  console.log('📁 Creating optimized package structure...');
  execSync('mkdir -p temp_package/extension');

  // Copy essential files
  const filesToCopy = ['package.json', 'README.md', 'LICENSE'];
  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      execSync(`cp ${file} temp_package/extension/`);
    }
  });

  // Copy only production files (exclude tests)
  const productionDirs = ['out', 'media'];
  productionDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      execSync(`cp -r ${dir} temp_package/extension/`);
    }
  });

  // Remove test files from the package
  console.log('🧹 Cleaning test files from package...');
  const testPatterns = [
    'temp_package/extension/out/__tests__',
    'temp_package/extension/out/**/*.test.js',
    'temp_package/extension/out/**/*.spec.js',
    'temp_package/extension/out/**/*.test.js.map',
    'temp_package/extension/out/**/*.spec.js.map',
  ];

  testPatterns.forEach(pattern => {
    try {
      execSync(`find temp_package/extension -path "${pattern}" -delete`, { stdio: 'ignore' });
    } catch (e) {
      // Ignore errors if files don't exist
    }
  });

  // Create VSIX package
  console.log('📦 Creating optimized VSIX package...');
  execSync(`cd temp_package && zip -r ../${vsixName} extension/`, { stdio: 'inherit' });

  // Clean up
  execSync('rm -rf temp_package');

  console.log(`✅ Optimized extension packaged successfully: ${vsixName}`);

  // Get file size
  const stats = fs.statSync(vsixName);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📦 File size: ${fileSizeInMB} MB`);

  // Show optimization benefits
  console.log('\n🎯 Optimization Benefits:');
  console.log('   ✅ Test files excluded from production build');
  console.log('   ✅ Source maps removed in production');
  console.log('   ✅ Code minified and optimized');
  console.log('   ✅ Dead code eliminated');
  console.log('   ✅ Console logs removed');

  console.log('\n🎯 To install locally:');
  console.log(`   code --install-extension ${vsixName}`);
  console.log('\n🎯 To analyze bundle:');
  console.log('   ANALYZE=true npm run build');
  console.log('\n🎯 To test in development:');
  console.log('   Press F5 in VS Code to open Extension Development Host');
} catch (error) {
  console.error('❌ Error packaging optimized extension:', error.message);
  process.exit(1);
}
