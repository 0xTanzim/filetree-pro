# 🌳 FileTree Pro - VS Code Extension

A powerful file tree generator for VS Code and Cursor. Generate beautiful file trees in multiple formats with smart exclusions and custom configurations.

[![Version](https://img.shields.io/visual-studio-marketplace/v/0xtanzim.filetree-pro?style=flat-square&label=version&color=blue)](https://marketplace.visualstudio.com/items?itemName=0xtanzim.filetree-pro)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/0xtanzim.filetree-pro?style=flat-square&label=downloads&color=brightgreen)](https://marketplace.visualstudio.com/items?itemName=0xtanzim.filetree-pro)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/0xtanzim.filetree-pro?style=flat-square&label=rating&color=yellow)](https://marketplace.visualstudio.com/items?itemName=0xtanzim.filetree-pro)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/0xtanzim.filetree-pro?style=flat-square&label=installs&color=orange)](https://marketplace.visualstudio.com/items?itemName=0xtanzim.filetree-pro)

## 📹 Demo Videos

Watch FileTree Pro in action below!

### 🧪 Demo Video

[![Short Demo](https://img.youtube.com/vi/k0TNEr43gQ0/hqdefault.jpg)](https://youtu.be/k0TNEr43gQ0)

➡️ _Right-click any folder → Generate file tree in seconds!_

## ⚙️ Configuration

### Quick Setup

Add this to your VS Code settings (`Ctrl/Cmd + ,`):

```json
{
  "filetree-pro.maxDepth": 10,
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
  "filetree-pro.respectGitignore": true
}
```

### 🎯 Depth Configuration

**NEW!** Control how deep the file tree scanner goes:

```json
{
  "filetree-pro.maxDepth": 5 // Scan 5 levels deep
}
```

**Depth Guide:**

| Depth | Speed          | Best For                       | Files Scanned |
| ----- | -------------- | ------------------------------ | ------------- |
| 2     | ⚡⚡⚡ Instant | README docs, quick overview    | ~50           |
| 5     | ⚡⚡ Fast      | Code reviews, presentations    | ~500          |
| 10    | ⚡ Good        | Full analysis, documentation   | ~5,000        |
| 15+   | ⏱️ Slower      | Deep analysis, large monorepos | 10,000+       |

**Tip:** Start with depth 3-5 for large projects, then increase if needed!

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

### 📚 Full Configuration Guide

For detailed configuration options including:

- Monorepo optimization strategies
- Language-specific configurations
- Performance tuning
- Exclusion pattern syntax

**[📖 Read the Complete Configuration Guide →](./docs/CONFIGURATION-GUIDE.md)**

## 🚀 Features

### 📁 Smart File Tree Generation

- **Right-click any folder** → Generate file tree
- **Select text** → Convert to tree format
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

Automatically excludes common build artifacts and **respects .gitignore files**:

- **Respect .gitignore**: Honors your project's .gitignore patterns
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

## 📝 Text to Tree Conversion

**New Feature!** Convert any text list into a beautiful tree format:

1. **Select text** in any editor (file paths, folder lists, etc.)
2. **Right-click** → "Convert Text to Tree"
3. **View** the converted tree in a new tab

### 📹 Demo Video - How to convert text to tree

[![Text to Tree Conversion](https://img.youtube.com/vi/ixqyyAPhodw/hqdefault.jpg)](https://youtu.be/ixqyyAPhodw)

### Example Input

```
src/
main.js
utils.js
components/
Header.js
Footer.js
```

### Example Output

```
# File Tree from Text

├── 📁 src/
├── 📄 main.js
├── 📄 utils.js
├── 📁 components/
├── 📄 Header.js
└── 📄 Footer.js

*Generated by FileTree Pro Extension*
```

## 📹 Video Guide

Watch this quick demo to see FileTree Pro in action:

[![Short Demo](https://img.youtube.com/vi/EvgOWywtJjU/hqdefault.jpg)](https://youtu.be/EvgOWywtJjU)

_Video shows: Right-click on folder → Generate File Tree → Choose format → View beautiful tree output_

## 📋 Commands

- `Generate File Tree` - Right-click on folder to generate tree
- `Convert Text to Tree` - Select text and convert to tree format
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

### .gitignore Support

```json
{
  "filetree-pro.respectGitignore": true
}
```

Automatically respects your project's `.gitignore` patterns when generating file trees. Enabled by default.

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

**💡 Tip:** Use `maxDepth: 3-5` for large projects to speed up generation!

---

## 🏗️ Architecture & Documentation

### For Developers & Contributors

Want to understand how FileTree Pro works under the hood? Check out our comprehensive documentation:

**[📐 Architecture Documentation →](./docs/ARCHITECTURE.md)**

**What's inside:**

- 🏛️ High-level architecture with Mermaid diagrams
- 📦 Component breakdown and responsibilities
- 🔄 Data flow and request lifecycle
- ⚙️ Configuration system explained
- 🔒 Security & validation patterns
- 📊 Performance optimization techniques
- 🚀 Future improvements roadmap

**Perfect for:**

- Senior developers reviewing the codebase
- Contributors wanting to understand the architecture
- Teams considering adoption
- Open source enthusiasts learning extension development

### Additional Docs

- **[📖 Configuration Guide](./docs/CONFIGURATION-GUIDE.md)** - Complete settings reference
- **[⚡ Quick Start](./docs/CONFIG-QUICK-START.md)** - Common configuration recipes
- **[🏛️ Architecture Proposal](./docs/ARCHITECTURE_PROPOSAL.md)** - Future improvements
- **[📝 Changelog](./CHANGELOG.md)** - Version history

---

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
