// Mock VS Code API
const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn((key: string, defaultValue: any) => {
      const config: Record<string, any> = {
        exclude: ['node_modules', '.git', 'dist', '.venv', 'build', 'out'],
        respectGitignore: true,
        useCopilot: true,
        maxDepth: 10,
        showFileSize: true,
        showFileDate: false,
        enableSearch: true,
        enableAnalytics: true,
      };
      return config[key] ?? defaultValue;
    }),
    has: jest.fn(() => true),
    inspect: jest.fn(),
    update: jest.fn(),
  })),
  workspaceFolders: [
    {
      uri: { fsPath: '/test/workspace' },
      name: 'test-workspace',
      index: 0,
    },
  ],
  fs: {
    readDirectory: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn(),
    watch: jest.fn(),
  },
  findFiles: jest.fn(),
  onDidChangeConfiguration: jest.fn(),
  openTextDocument: jest.fn(),
};

const window = {
  createTreeView: jest.fn(() => ({
    reveal: jest.fn(),
    dispose: jest.fn(),
  })),
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showQuickPick: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    append: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn(),
  })),
  showTextDocument: jest.fn(),
  withProgress: jest.fn((options, task) => {
    return task(
      {
        report: jest.fn(),
      },
      {
        isCancellationRequested: false,
        onCancellationRequested: jest.fn(),
      }
    );
  }),
};

const extensions = {
  getExtension: jest.fn(),
};

const commands = {
  registerCommand: jest.fn(() => ({
    dispose: jest.fn(),
  })),
  executeCommand: jest.fn(),
};

const Uri = {
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
  joinPath: jest.fn((uri: any, ...paths: string[]) => ({
    ...uri,
    path: `${uri.path}/${paths.join('/')}`,
    fsPath: `${uri.fsPath}/${paths.join('/')}`,
  })),
};

const FileType = {
  Unknown: 0,
  File: 1,
  Directory: 2,
  SymbolicLink: 64,
};

const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2,
};

const EndOfLine = {
  LF: 1,
  CRLF: 2,
};

const ViewColumn = {
  Active: -1,
  Beside: -2,
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
  Six: 6,
  Seven: 7,
  Eight: 8,
  Nine: 9,
};

class Selection {
  constructor(
    public anchorLine: number,
    public anchorCharacter: number,
    public activeLine: number,
    public activeCharacter: number
  ) {}
}

const ThemeIcon = jest.fn((id: string) => ({ id }));

const EventEmitter = jest.fn(() => ({
  fire: jest.fn(),
  event: jest.fn(),
  dispose: jest.fn(),
}));

const TreeItem = jest.fn();
const CancellationTokenSource = jest.fn(() => ({
  token: {
    isCancellationRequested: false,
    onCancellationRequested: jest.fn(),
  },
  cancel: jest.fn(),
  dispose: jest.fn(),
}));

const ProgressLocation = {
  SourceControl: 1,
  Window: 10,
  Notification: 15,
};

// Export everything
export {
  CancellationTokenSource,
  commands,
  EndOfLine,
  EventEmitter,
  extensions,
  FileType,
  ProgressLocation,
  Selection,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  ViewColumn,
  window,
  workspace,
};

export default {
  workspace,
  window,
  extensions,
  commands,
  Uri,
  FileType,
  TreeItemCollapsibleState,
  EndOfLine,
  ViewColumn,
  Selection,
  ThemeIcon,
  EventEmitter,
  TreeItem,
  CancellationTokenSource,
  ProgressLocation,
};
