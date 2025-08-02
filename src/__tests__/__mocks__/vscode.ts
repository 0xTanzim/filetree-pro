// Mock VS Code API
const mockVscode = {
  window: {
    createTreeView: jest.fn(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue: any) => {
        const config: Record<string, any> = {
          exclude: ['node_modules', 'dist'],
          useCopilot: true,
          maxDepth: 10,
          showFileSize: true,
          showFileDate: false,
          enableSearch: true,
          enableAnalytics: true,
        };
        return config[key] ?? defaultValue;
      }),
    })),
    workspaceFolders: [
      {
        uri: { fsPath: '/test/workspace' },
        name: 'test-workspace',
      },
    ],
    fs: {
      readDirectory: jest.fn(),
      readFile: jest.fn(),
      stat: jest.fn(),
      watch: jest.fn(),
    },
  },
  extensions: {
    getExtension: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  Uri: {
    file: jest.fn((path: string) => ({
      fsPath: path,
      scheme: 'file',
      authority: '',
      path: path,
      query: '',
      fragment: '',
      toString: () => `file://${path}`,
      with: jest.fn(),
      toJSON: jest.fn(),
    })),
    joinPath: jest.fn(),
  },
  FileType: {
    File: 1,
    Directory: 2,
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  ThemeIcon: jest.fn(),
  EventEmitter: jest.fn(() => ({
    fire: jest.fn(),
    event: jest.fn(),
  })),
};

export = mockVscode;
