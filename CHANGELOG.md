## 📝 Changelog

### v0.1.92+ - Issue #5 Fixes

- 🐛 **Fixed**: Auto-hidden flag incorrectly hiding important files
- 🐛 **Fixed**: Files with "log" in name (like `requestLogger.ts`) being incorrectly excluded
- 🐛 **Fixed**: Config files (`.env`, `.gitignore`, `.prettierignore`) being auto-hidden
- 🐛 **Fixed**: Lock files (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`) being excluded
- 🐛 **Fixed**: Extension crashes with complex exclusion patterns like `**/node_modules/**`
- ✨ **Enhanced**: Proper glob pattern matching with `**` support
- ✨ **Enhanced**: Better multi-language project support (Python, Go, Rust, Java, C#, etc.)
- ✨ **Enhanced**: Cross-platform path handling
- ✨ **Enhanced**: 83+ comprehensive tests for reliability
- 🔧 **Improved**: Smarter exclusion logic - shows important files, hides true build artifacts

### v0.1.0 - Initial Release

- ✅ Core file tree generation
- ✅ 4 output formats (Markdown, JSON, SVG, ASCII)
- ✅ Universal language support (50+ languages)
- ✅ Smart exclusions system
- ✅ Custom configuration support
- ✅ Performance optimizations
- ✅ VS Code and Cursor compatibility
