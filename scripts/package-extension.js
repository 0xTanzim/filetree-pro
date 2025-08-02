#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building FileTree Pro Extension...');

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

  // Compile TypeScript
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc -p ./', { stdio: 'inherit' });

  // Create package structure
  console.log('📁 Creating package structure...');
  execSync('mkdir -p temp_package/extension');

  // Copy essential files
  const filesToCopy = ['package.json', 'README.md', 'LICENSE'];

  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      execSync(`cp ${file} temp_package/extension/`);
    }
  });

  // Copy directories
  const dirsToTopy = ['out', 'media'];
  dirsToTopy.forEach(dir => {
    if (fs.existsSync(dir)) {
      execSync(`cp -r ${dir} temp_package/extension/`);
    }
  });

  // Create VSIX package
  console.log('📦 Creating VSIX package...');
  execSync(`cd temp_package && zip -r ../${vsixName} extension/`, { stdio: 'inherit' });

  // Clean up
  execSync('rm -rf temp_package');

  console.log(`✅ Extension packaged successfully: ${vsixName}`);

  // Get file size
  const stats = fs.statSync(vsixName);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📦 File size: ${fileSizeInMB} MB`);

  console.log('\n🎯 To install locally:');
  console.log(`   code --install-extension ${vsixName}`);
  console.log('\n🎯 To test in development:');
  console.log('   Press F5 in VS Code to open Extension Development Host');
} catch (error) {
  console.error('❌ Error packaging extension:', error.message);
  process.exit(1);
}
