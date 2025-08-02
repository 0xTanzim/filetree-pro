# 🚀 VS Code Extension Development Guide

## 📋 Development Workflow

### 1. 🛠️ Development Setup

#### Install VS Code Extension Development Tools

```bash
# Install vsce globally for packaging
npm install -g @vscode/vsce

# Or use pnpm (recommended)
pnpm add -g @vscode/vsce
```

#### Required VS Code Extensions for Development

- **Extension Pack for VS Code** - Provides debugging tools
- **TypeScript and JavaScript Language Features** - For TypeScript support

### 2. 🔧 Development Testing

#### Method 1: F5 Debugging (Recommended for Development)

```bash
# 1. Open the project in VS Code
code .

# 2. Press F5 or go to Run and Debug
# This opens a new VS Code window with your extension loaded
```

#### Method 2: Extension Development Host

```bash
# 1. Compile the extension
pnpm run compile

# 2. Open VS Code with extension development host

```

### 3. 📦 Local Installation Testing

#### Package the Extension

```bash
# Create .vsix package
pnpm run package
# or
npx @vscode/vsce package
```

#### Install Locally in VS Code

```bash
# Method 1: Command Palette
# 1. Open VS Code
# 2. Ctrl+Shift+P (or Cmd+Shift+P on Mac)
# 3. Type: "Extensions: Install from VSIX..."
# 4. Select your .vsix file

# Method 2: Command Line
code --install-extension filetreeproai-0.1.0.vsix
```

#### Uninstall Extension

```bash
# Method 1: VS Code UI
# 1. Go to Extensions (Ctrl+Shift+X)
# 2. Find your extension
# 3. Click Uninstall

# Method 2: Command Line
code --uninstall-extension filetreeproai
```

## 🧪 Testing Your Extension

### 1. 🔍 Manual Testing Checklist

#### Basic Functionality

- [ ] Extension activates when opening a workspace
- [ ] FileTreeProAI view appears in Explorer panel
- [ ] Tree shows files and folders correctly
- [ ] Exclusions work (node_modules, .git, etc. hidden)
- [ ] Context menus appear on right-click

#### Commands Testing

- [ ] `FileTreeProAI: Refresh Tree` - Updates the tree
- [ ] `FileTreeProAI: Search Files` - Opens search dialog
- [ ] `FileTreeProAI: Export Tree` - Exports to different formats
- [ ] `FileTreeProAI: Show Analytics` - Shows project statistics
- [ ] `FileTreeProAI: Open File` - Opens selected file
- [ ] `FileTreeProAI: Copy Path` - Copies file path
- [ ] `FileTreeProAI: Reveal in Explorer` - Shows in system explorer

#### Copilot Integration (if Copilot installed)

- [ ] `FileTreeProAI: Analyze with Copilot` - Analyzes selected file
- [ ] `FileTreeProAI: Get Project Suggestions` - Gets AI suggestions

### 2. 🐛 Debugging

#### Enable Extension Logs

```json
// In VS Code settings.json
{
  "extensions.logLevel": "debug",
  "filetreeproai.debug": true
}
```

#### View Extension Logs

1. Open Command Palette (Ctrl+Shift+P)
2. Type: "Developer: Show Logs..."
3. Select "Extension Host"
4. Look for your extension logs

#### Debug Console

- Open Debug Console (Ctrl+Shift+Y)
- Add `console.log()` statements in your code
- Check the Debug Console for output

### 3. 🔧 Common Development Issues

#### Extension Not Loading

```bash
# Check if extension is compiled
pnpm run compile

# Check for TypeScript errors
pnpm run lint

# Verify package.json activation events
```

#### Tree View Not Showing

```json
// Check package.json contributions
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "filetreeproai",
          "title": "FileTreeProAI",
          "icon": "media/tree-icon.svg"
        }
      ]
    },
    "views": {
      "filetreeproai": [
        {
          "id": "fileTreeProAI",
          "name": "File Tree"
        }
      ]
    }
  }
}
```

#### Commands Not Working

```typescript
// Check command registration in extension.ts
context.subscriptions.push(
  vscode.commands.registerCommand('filetreeproai.refresh', () => {
    // Your command logic
  })
);
```

## 📦 Publishing Workflow

### 1. 🏷️ Prepare for Publishing

#### Update package.json

```json
{
  "name": "filetreeproai",
  "displayName": "FileTreeProAI",
  "description": "Premium file tree generator with Copilot integration",
  "version": "0.1.0",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.102.0"
  },
  "categories": ["Other"],
  "keywords": ["file-tree", "project-structure", "copilot", "analytics"],
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/filetreeproai.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/filetreeproai/issues"
  },
  "homepage": "https://github.com/yourusername/filetreeproai#readme"
}
```

#### Create Marketplace Assets

- **Icon**: 128x128 PNG for marketplace
- **Screenshots**: 1280x720 PNG showing features
- **README**: Comprehensive documentation
- **CHANGELOG**: Version history

### 2. 📤 Publishing Steps

#### Create Publisher Account

1. Go to https://marketplace.visualstudio.com/
2. Sign in with Microsoft account
3. Create publisher account
4. Get publisher ID

#### Package and Publish

```bash
# Login to marketplace
npx @vscode/vsce login your-publisher-name

# Package extension
npx @vscode/vsce package

# Publish to marketplace
npx @vscode/vsce publish
```

## 🎯 Development Best Practices

### 1. 📁 Project Structure

```
fileTree/
├── src/
│   ├── extension.ts          # Main entry point
│   ├── providers/            # Tree data providers
│   ├── services/             # Business logic
│   ├── commands/             # Command handlers
│   ├── utils/                # Utility functions
│   └── types.ts              # TypeScript types
├── media/                    # Icons and assets
├── test/                     # Test files
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
└── .vscodeignore            # Packaging exclusions
```

### 2. 🔄 Development Cycle

```bash
# 1. Make changes to code
# 2. Compile
pnpm run compile

# 3. Test in development host (F5)
# 4. Fix issues
# 5. Package for local testing
pnpm run package

# 6. Install locally
code --install-extension filetreeproai-0.1.0.vsix

# 7. Test in regular VS Code
# 8. Repeat until satisfied
```

### 3. 🧪 Testing Strategy

- **Unit Tests**: Test individual functions
- **Integration Tests**: Test VS Code API interactions
- **Manual Testing**: Test in real VS Code environment
- **Cross-Platform**: Test on Windows, macOS, Linux

## 🚀 Quick Start Commands

```bash
# Development workflow
pnpm run compile          # Compile TypeScript
pnpm run lint            # Check code quality
pnpm run test            # Run unit tests
pnpm run package         # Create .vsix package

# Testing commands
code --install-extension filetreeproai-0.1.0.vsix
code --uninstall-extension filetreeproai

# Publishing commands
npx @vscode/vsce login your-publisher-name
npx @vscode/vsce publish
```

## 📚 Additional Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [Marketplace Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

---

**Happy Coding! 🎉**
