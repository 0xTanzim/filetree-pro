// Global test setup
import '@testing-library/jest-dom';

// Declare global types
declare global {
  var vscode: any;
  var testUtils: any;
}

// Mock VS Code API globally
(global as any).vscode = {
  workspace: {
    fs: {
      readDirectory: jest.fn(),
      readFile: jest.fn(),
      stat: jest.fn(),
      watch: jest.fn(),
    },
    getConfiguration: jest.fn(),
    findFiles: jest.fn(),
  },
  window: {
    createTreeView: jest.fn(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showTextDocument: jest.fn(),
  },
  commands: {
    executeCommand: jest.fn(),
    registerCommand: jest.fn(),
  },
  extensions: {
    getExtension: jest.fn(),
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path })),
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  ThemeIcon: jest.fn(),
  TreeItem: jest.fn(),
  TreeDataProvider: jest.fn(),
  EventEmitter: jest.fn(),
  FileType: {
    Unknown: 0,
    File: 1,
    Directory: 2,
    SymbolicLink: 64,
  },
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process methods
global.process = {
  ...process,
  platform: 'linux',
  env: {
    ...process.env,
    NODE_ENV: 'test',
  },
};

// Setup global test utilities
(global as any).testUtils = {
  createMockUri: (path: string) => ({ fsPath: path }),
  createMockFileTreeItem: (name: string, isDirectory = false) => ({
    name,
    isDirectory,
    children: isDirectory ? [] : undefined,
  }),
  createMockFileStats: (size = 1024, mtime = Date.now()) => ({
    type: 1, // File
    size,
    mtime,
  }),
};
