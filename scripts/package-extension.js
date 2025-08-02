#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Create output directory
const outDir = 'dist';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// Create the .vsix file
const output = fs.createWriteStream(
  path.join(outDir, `${packageJson.name}-${packageJson.version}.vsix`)
);
const archive = archiver('zip', {
  zlib: { level: 9 }, // Sets the compression level
});

output.on('close', () => {
  console.log(
    `✅ Extension packaged successfully: ${packageJson.name}-${packageJson.version}.vsix`
  );
  console.log(`📦 File size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', err => {
  throw err;
});

archive.pipe(output);

// Add essential files to the archive
const essentialFiles = ['package.json', 'README.md', 'CHANGELOG.md', 'LICENSE', '.vscodeignore'];

essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    archive.file(file, { name: file });
  }
});

// Add the entire out directory (compiled JavaScript files)
if (fs.existsSync('out')) {
  archive.directory('out', 'out');
}

// Add media directory if it exists
if (fs.existsSync('media')) {
  archive.directory('media', 'media');
}

// Add any other directories that might be needed
const additionalDirs = ['src'];
additionalDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    archive.directory(dir, dir);
  }
});

archive.finalize();
