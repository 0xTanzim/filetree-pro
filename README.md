# 🌳 FileTree Pro - VS Code Extension

A powerful file tree generator for VS Code and Cursor. Generate beautiful file trees in multiple formats with smart exclusions and custom configurations.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=filetree-pro)
[![Downloads](https://img.shields.io/badge/downloads-0-brightgreen.svg)](https://marketplace.visualstudio.com/items?itemName=filetree-pro)
[![Rating](https://img.shields.io/badge/rating-0.0-yellow.svg)](https://marketplace.visualstudio.com/items?itemName=filetree-pro)

## 🎬 Demo Video

<video width="100%" controls>
  <source src="media/guide.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

_See FileTree Pro in action: Right-click any folder → Generate beautiful file trees in multiple formats!_

## ⚙️ Configuration

### Quick Setup

Add this to your VS Code settings (`Ctrl/Cmd + ,`):

```json
{
  "filetree-pro.exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**",
    "**/.venv/**",
    "**/build/**",
    "**/coverage/**",
    "**/*.log",
    "**/*.tmp"
  ],
  "filetree-pro.showIcons": true,
  "filetree-pro.useCopilot": false
}
```

### Custom Exclusions

Add your own patterns to exclude files/folders:

```json
{
  "filetree-pro.exclude": [
    "**/node_modules/**",
    "**/my-custom-folder/**",
    "**/*.test.js",
    "**/temp/**"
  ]
}
```

## 🚀 Features

### 📁 Smart File Tree Generation

- **Right-click any folder** → Generate file tree
- **4 Output Formats**: Markdown, JSON, SVG, ASCII
- **Icon Support**: Beautiful icons for all file types
- **Smart Exclusions**: Automatically excludes build files, dependencies, and temp files

### 🌍 Universal Language Support

- **50+ Programming Languages**: JavaScript, Python, Java, C++, Go, Rust, Kotlin, Scala, C#, F#, Dart, R, MATLAB, Julia, Perl, Lua, Haskell, Clojure, Elixir, Erlang, OCaml, Nim, Zig, V, Assembly, and more
- **Special Files**: Dockerfile, Makefile, README, LICENSE, CHANGELOG
- **Web Technologies**: HTML, CSS, SCSS, Vue, Svelte
- **Configuration Files**: YAML, TOML, INI, XML, JSON

### 🎨 Multiple Export Formats

| Format          | Use Case                | Features                |
| --------------- | ----------------------- | ----------------------- |
| **📄 Markdown** | Documentation, GitHub   | Icons, clean formatting |
| **📊 JSON**     | APIs, Data processing   | Structured data, icons  |
| **🎨 SVG**      | Presentations, diagrams | Visual, scalable        |
| **📝 ASCII**    | Universal compatibility | Plain text, portable    |

### 🛡️ Smart Exclusions

Automatically excludes common build artifacts:

- `node_modules`, `dist`, `build`, `out`
- `.git`, `.venv`, `venv`, `env`
- `*.log`, `*.tmp`, `*.cache`
- `__pycache__`, `*.pyc`
- `target`, `bin`, `obj`
- `.DS_Store`, `Thumbs.db`

### ⚡ Performance Optimized

- **Memory Management**: Efficient for large projects
- **Async Processing**: Non-blocking tree generation
- **Loading States**: Visual feedback during processing
- **Batch Processing**: Handles 10,000+ files smoothly

## 🎯 Quick Start

1. **Install Extension**: Search "FileTree Pro" in VS Code Extensions
2. **Open Project**: Open any project folder in VS Code
3. **Generate Tree**: Right-click on any folder → "Generate File Tree"
4. **Choose Format**: Select Markdown, JSON, SVG, or ASCII
5. **Choose Style**: With or without icons
6. **Save**: The tree opens in an unsaved tab - save when ready!

## 📹 Video Guide

Watch this quick demo to see FileTree Pro in action:

<video width="100%" controls>
  <source src="media/guide.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

_Video shows: Right-click on folder → Generate File Tree → Choose format → View beautiful tree output_

## 📋 Commands

- `Generate File Tree` - Right-click on folder to generate tree
- `Refresh Tree` - Regenerate with current settings
- `Export Tree` - Export in different formats

## 🎨 Examples

### Markdown Output

```
# File Tree: my-project

├── 📁 src/
│   ├── 📄 main.js
│   ├── 📄 utils.js
│   └── 📁 components/
│       ├── 📄 Header.js
│       └── 📄 Footer.js
├── 📄 package.json
├── 📄 README.md
└── 📁 node_modules/ 🚫 (auto-hidden)
```

### JSON Output

```json
{
  "name": "my-project",
  "type": "directory",
  "icon": "📁",
  "children": [
    {
      "name": "src",
      "type": "directory",
      "icon": "📁",
      "children": [...]
    }
  ]
}
```

## 🔧 Advanced Configuration

### Custom Exclusions

```json
{
  "filetree-pro.exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**",
    "**/my-custom-folder/**",
    "**/*.test.js",
    "**/temp/**",
    "**/logs/**"
  ]
}
```

### Icon Settings

```json
{
  "filetree-pro.showIcons": true
}
```

### Copilot Integration (Optional)

```json
{
  "filetree-pro.useCopilot": false
}
```

## 🌟 Use Cases

### For Developers

- **Project Documentation**: Generate file trees for README files
- **Code Reviews**: Share project structure with team
- **Onboarding**: Help new developers understand project layout
- **Architecture Analysis**: Visualize project structure

### For Teams

- **Documentation**: Export trees for project docs
- **Presentations**: Use SVG format for slides
- **API Documentation**: JSON format for tools
- **Cross-platform**: ASCII format works everywhere

### For Educators

- **Teaching**: Show project structures to students
- **Examples**: Demonstrate different project organizations
- **Analysis**: Analyze student project structures

## 🚀 Performance

- **Small Projects** (< 1,000 files): < 1 second
- **Medium Projects** (1,000-10,000 files): < 3 seconds
- **Large Projects** (10,000+ files): < 10 seconds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📝 Changelog

### v0.1.0

- ✅ Core file tree generation
- ✅ 4 output formats (Markdown, JSON, SVG, ASCII)
- ✅ Universal language support (50+ languages)
- ✅ Smart exclusions system
- ✅ Custom configuration support
- ✅ Performance optimizations
- ✅ VS Code and Cursor compatibility

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## ☕ Support

If you find this extension helpful, consider buying me a coffee! ☕

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-%23FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/tanzimhossain)

## 📞 Contact & Social Media

- **Email**: <tanzimhossain2@gmail.com>
- **GitHub**: [@0xTanzim](https://github.com/0xTanzim)
- **LinkedIn**: [@0xtanzim](https://linkedin.com/in/0xtanzim)
- **Facebook**: [@0xtanzim](https://facebook.com/0xtanzim)
- **Instagram**: [@0xtanzim](https://instagram.com/0xtanzim)

---

**Made with ❤️ for the VS Code community**
