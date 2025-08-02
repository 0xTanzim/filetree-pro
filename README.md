# 🌳 FileTreeProAI - Premium VS Code Extension

A smart, interactive file tree generator for VS Code and Cursor with GitHub Copilot integration for AI-powered features.

## ✨ Features

### 🌳 Smart File Tree

- **Interactive Tree View**: Collapsible file tree in the Explorer panel
- **Smart Exclusions**: Automatically excludes `node_modules`, `dist`, `.git`, `.venv`, `build`, `out`, `.pyc`, `target`, etc.
- **Real-time Updates**: Tracks file changes using VS Code's file system watcher
- **Multi-language Support**: Works with all programming languages (Python, JavaScript, Java, C++, Go, Ruby, etc.)

### 🔍 Advanced Search & Filter

- **Real-time Search**: Find files by name, extension, or content
- **Smart Filtering**: Filter by file type, size, and date
- **Search History**: Save and reuse search queries

### 📊 Analytics Dashboard

- **Project Statistics**: File counts, sizes, and type distribution
- **Visual Charts**: Interactive charts showing project structure
- **Performance Metrics**: Track project health and trends

### 🤖 AI-Powered Features (Copilot Required)

- **File Summarization**: Get intelligent summaries of file contents
- **Organization Suggestions**: AI-powered recommendations for file structure
- **Naming Conventions**: Smart suggestions for file and folder names
- **Code Analysis**: Complexity analysis and improvement suggestions

### 📤 Export & Share

- **Multiple Formats**: Export as JSON, Markdown, SVG, or ASCII
- **Visual Diagrams**: Generate PNG/SVG diagrams for documentation
- **Clipboard Support**: Copy file paths and tree structures
- **Team Collaboration**: Shareable links for team projects

## 🚀 Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "FileTreeProAI"
4. Click Install

### From VSIX Package

1. Download the `.vsix` file from releases
2. In VS Code, go to Extensions
3. Click the "..." menu and select "Install from VSIX..."
4. Choose the downloaded file

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/your-username/filetreeproai.git
cd filetreeproai

# Install dependencies
pnpm install

# Compile the extension
pnpm run compile

# Package the extension
pnpm run package
```

## 🎯 Quick Start

1. **Open a Project**: Open any project folder in VS Code
2. **View File Tree**: Click the FileTreeProAI icon in the activity bar
3. **Explore Files**: Navigate through the interactive file tree
4. **Search Files**: Use the search bar to find specific files
5. **Export Tree**: Right-click to export the tree in various formats

## ⚙️ Configuration

### Settings

Add these to your VS Code settings:

```json
{
  "filetreeproai.exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**",
    "**/.venv/**",
    "**/build/**",
    "**/out/**",
    "**/*.pyc",
    "**/target/**"
  ],
  "filetreeproai.useCopilot": true,
  "filetreeproai.maxDepth": 10,
  "filetreeproai.showFileSize": true,
  "filetreeproai.showFileDate": true,
  "filetreeproai.enableSearch": true,
  "filetreeproai.enableAnalytics": true
}
```

### Custom Exclusions

Add your own exclusion patterns:

```json
{
  "filetreeproai.exclude": ["**/node_modules/**", "**/coverage/**", "**/.DS_Store", "**/Thumbs.db"]
}
```

## 🎨 Commands

### Tree View Commands

- `FileTreeProAI: Refresh Tree` - Refresh the file tree
- `FileTreeProAI: Search Files` - Open search dialog
- `FileTreeProAI: Export Tree` - Export tree in various formats
- `FileTreeProAI: Show Analytics` - Open analytics dashboard

### File Operations

- `FileTreeProAI: Open File` - Open selected file
- `FileTreeProAI: Copy Path` - Copy file path to clipboard
- `FileTreeProAI: Reveal in Explorer` - Show file in system explorer

### AI Features (Copilot Required)

- `FileTreeProAI: Analyze with Copilot` - Get AI analysis of selected file
- `FileTreeProAI: Get Project Suggestions` - Get AI suggestions for project structure

## 🤖 Copilot Integration

### Requirements

- GitHub Copilot extension installed and active
- Valid Copilot subscription

### Features

- **File Summarization**: Get intelligent summaries of code files
- **Organization Suggestions**: AI recommendations for better file structure
- **Naming Conventions**: Smart suggestions for file and folder names
- **Code Analysis**: Complexity analysis and improvement suggestions

### Usage

1. Right-click on any file in the tree
2. Select "Analyze with Copilot"
3. View AI-generated insights and suggestions

## 📊 Analytics Dashboard

### Project Statistics

- Total files and folders
- Total project size
- File type distribution
- Largest files
- Recent files

### Visual Charts

- File type pie chart
- File size distribution
- Project structure timeline

### Export Options

- JSON data export
- PNG/SVG chart export
- CSV data export

## 🔧 Development

### Prerequisites

- Node.js 18+
- pnpm
- VS Code 1.85+

### Setup

```bash
# Install dependencies
pnpm install

# Compile TypeScript
pnpm run compile

# Run tests
pnpm test

# Package extension
pnpm run package
```

### Project Structure

```
src/
├── extension.ts          # Main extension entry point
├── types.ts             # TypeScript type definitions
├── services/
│   ├── fileSystemService.ts    # File system operations
│   ├── copilotService.ts       # Copilot integration
│   └── analyticsService.ts     # Analytics and statistics
├── providers/
│   └── fileTreeProvider.ts     # Tree view data provider
├── commands/
│   └── commands.ts             # Command registrations
└── utils/
    └── fileUtils.ts            # Utility functions
```

### Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test fileSystemService.test.ts
```

## 🎯 Use Cases

### For Developers

- **Project Navigation**: Quickly find and navigate files
- **Code Organization**: Understand project structure at a glance
- **File Discovery**: Discover related files and dependencies

### For Teams

- **Documentation**: Export file trees for project documentation
- **Code Reviews**: Share file structures for review discussions
- **Onboarding**: Help new team members understand project structure

### For Educators

- **Teaching**: Visualize project structures for students
- **Examples**: Show different project organization patterns
- **Analysis**: Analyze student project structures

## 🚀 Performance

### Optimizations

- **Lazy Loading**: Tree items load on demand
- **Caching**: File system data cached for performance
- **Incremental Updates**: Only refresh changed parts of the tree
- **Memory Management**: Efficient memory usage for large projects

### Benchmarks

- **Small Projects** (< 1,000 files): < 1 second load time
- **Medium Projects** (1,000-10,000 files): < 3 seconds load time
- **Large Projects** (10,000+ files): < 10 seconds load time

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing

### Testing Guidelines

- Unit tests for all new features
- Integration tests for complex interactions
- Performance tests for large projects

## 📝 Changelog

### v0.1.0 (Current)

- ✅ Core file tree functionality
- ✅ Smart exclusions system
- ✅ Basic search and filter
- ✅ Copilot integration framework
- ✅ Analytics dashboard
- ✅ Export functionality
- ✅ VS Code and Cursor compatibility

### Planned Features

- 🎯 Drag-and-drop file organization
- 🎯 Advanced search with regex
- 🎯 Custom themes and icons
- 🎯 Performance optimizations
- 🎯 Enhanced AI features

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- VS Code Extension API
- GitHub Copilot for AI features
- Community contributors and feedback

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/filetreeproai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/filetreeproai/discussions)
- **Documentation**: [Wiki](https://github.com/your-username/filetreeproai/wiki)

---

**Made with ❤️ for the VS Code community**
