/**
 * Centralized error handling for the FileTree Pro extension.
 * Provides consistent error logging, user notifications, and telemetry.
 *
 * @module errorHandler
 * @author FileTree Pro Team
 * @since 0.2.0
 */

import * as vscode from 'vscode';

/**
 * Error severity levels for categorization and telemetry
 */
export enum ErrorSeverity {
  /** Informational message, not an error */
  INFO = 'info',
  /** Warning that doesn't prevent operation */
  WARNING = 'warning',
  /** Error that prevents current operation */
  ERROR = 'error',
  /** Critical error that may affect extension stability */
  CRITICAL = 'critical',
}

/**
 * Error categories for better error tracking and debugging
 */
export enum ErrorCategory {
  /** File system operation errors (read, write, access) */
  FILE_SYSTEM = 'FileSystem',
  /** Security validation errors (path traversal, ReDoS) */
  SECURITY = 'Security',
  /** API or network errors (Copilot, rate limiting) */
  API = 'API',
  /** Configuration or settings errors */
  CONFIGURATION = 'Configuration',
  /** User input validation errors */
  VALIDATION = 'Validation',
  /** Internal extension errors */
  INTERNAL = 'Internal',
}

/**
 * Structured error information for logging and telemetry
 */
export interface ErrorInfo {
  /** Error message for display */
  readonly message: string;
  /** Error severity level */
  readonly severity: ErrorSeverity;
  /** Error category */
  readonly category: ErrorCategory;
  /** Original error object if available */
  readonly originalError?: Error;
  /** Additional context data */
  readonly context?: Record<string, unknown>;
  /** Timestamp when error occurred */
  readonly timestamp: Date;
}

/**
 * Centralized error handler with output channel and user notifications.
 * Singleton pattern ensures consistent error handling across the extension.
 *
 * @example
 * ```typescript
 * const handler = ErrorHandler.getInstance();
 * handler.handleError({
 *   message: 'Failed to read file',
 *   severity: ErrorSeverity.ERROR,
 *   category: ErrorCategory.FILE_SYSTEM,
 *   originalError: error,
 *   context: { path: '/path/to/file' }
 * });
 * ```
 */
export class ErrorHandler {
  private static instance: ErrorHandler | null = null;
  private outputChannel: vscode.OutputChannel | null = null;
  private errorCount: Map<ErrorCategory, number> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Initialize error counts
    for (const category of Object.values(ErrorCategory)) {
      this.errorCount.set(category, 0);
    }
  }

  /**
   * Gets the singleton instance of ErrorHandler.
   * Lazy initialization ensures output channel is created only when needed.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   *
   * @returns The singleton ErrorHandler instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Initializes the output channel for error logging.
   * Should be called during extension activation.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   *
   * @param channelName - Optional custom channel name (defaults to 'FileTree Pro')
   */
  public initialize(channelName: string = 'FileTree Pro'): void {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel(channelName);
    }
  }

  /**
   * Handles an error with appropriate logging and user notification.
   * Automatically determines notification type based on severity.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   *
   * @param errorInfo - Structured error information
   * @returns Promise that resolves when error is handled
   */
  public async handleError(errorInfo: ErrorInfo): Promise<void> {
    // Increment error count for telemetry
    const currentCount = this.errorCount.get(errorInfo.category) || 0;
    this.errorCount.set(errorInfo.category, currentCount + 1);

    // Log to output channel
    this.logToOutput(errorInfo);

    // Show user notification based on severity
    await this.showNotification(errorInfo);

    // Log to console in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('[FileTree Pro]', errorInfo);
    }
  }

  /**
   * Logs error information to the output channel.
   * Creates formatted log entry with timestamp, category, and context.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   *
   * @param errorInfo - Error information to log
   */
  private logToOutput(errorInfo: ErrorInfo): void {
    if (!this.outputChannel) {
      this.initialize();
    }

    const timestamp = errorInfo.timestamp.toISOString();
    const category = errorInfo.category;
    const severity = errorInfo.severity.toUpperCase();

    // Build log message
    let logMessage = `[${timestamp}] [${severity}] [${category}] ${errorInfo.message}`;

    // Add original error stack if available
    if (errorInfo.originalError) {
      logMessage += `\n  Original Error: ${errorInfo.originalError.message}`;
      if (errorInfo.originalError.stack) {
        logMessage += `\n  Stack: ${errorInfo.originalError.stack}`;
      }
    }

    // Add context if available
    if (errorInfo.context && Object.keys(errorInfo.context).length > 0) {
      logMessage += `\n  Context: ${JSON.stringify(errorInfo.context, null, 2)}`;
    }

    this.outputChannel!.appendLine(logMessage);
    this.outputChannel!.appendLine(''); // Add blank line for readability
  }

  /**
   * Shows appropriate user notification based on error severity.
   * Provides "Show Details" action to open output channel.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   *
   * @param errorInfo - Error information to display
   */
  private async showNotification(errorInfo: ErrorInfo): Promise<void> {
    const message = `FileTree Pro: ${errorInfo.message}`;
    const showDetailsAction = 'Show Details';

    let selectedAction: string | undefined;

    // Choose notification type based on severity
    switch (errorInfo.severity) {
      case ErrorSeverity.INFO:
        selectedAction = await vscode.window.showInformationMessage(message, showDetailsAction);
        break;
      case ErrorSeverity.WARNING:
        selectedAction = await vscode.window.showWarningMessage(message, showDetailsAction);
        break;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        selectedAction = await vscode.window.showErrorMessage(message, showDetailsAction);
        break;
    }

    // Show output channel if user clicked "Show Details"
    if (selectedAction === showDetailsAction && this.outputChannel) {
      this.outputChannel.show();
    }
  }

  /**
   * Creates a standardized error info object for file system errors.
   * Helper method for common file system error scenarios.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   *
   * @param message - User-friendly error message
   * @param error - Original error object
   * @param context - Additional context (e.g., file path)
   * @returns Structured error information
   */
  public createFileSystemError(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): ErrorInfo {
    return {
      message,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.FILE_SYSTEM,
      originalError: error,
      context,
      timestamp: new Date(),
    };
  }

  /**
   * Creates a standardized error info object for security validation errors.
   * Helper method for security-related error scenarios.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   *
   * @param message - User-friendly error message
   * @param context - Additional context (e.g., invalid path)
   * @returns Structured error information
   */
  public createSecurityError(message: string, context?: Record<string, unknown>): ErrorInfo {
    return {
      message,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.SECURITY,
      context,
      timestamp: new Date(),
    };
  }

  /**
   * Creates a standardized error info object for API errors.
   * Helper method for API-related error scenarios.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   *
   * @param message - User-friendly error message
   * @param error - Original error object
   * @param context - Additional context (e.g., API endpoint)
   * @returns Structured error information
   */
  public createApiError(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): ErrorInfo {
    return {
      message,
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.API,
      originalError: error,
      context,
      timestamp: new Date(),
    };
  }

  /**
   * Gets error statistics for telemetry.
   * Provides count of errors by category for debugging.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   *
   * @returns Map of error counts by category
   */
  public getErrorStatistics(): Map<ErrorCategory, number> {
    return new Map(this.errorCount);
  }

  /**
   * Resets error statistics.
   * Useful for testing or periodic statistics reset.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  public resetStatistics(): void {
    for (const category of Object.values(ErrorCategory)) {
      this.errorCount.set(category, 0);
    }
  }

  /**
   * Disposes resources used by the error handler.
   * Should be called during extension deactivation.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  public dispose(): void {
    if (this.outputChannel) {
      this.outputChannel.dispose();
      this.outputChannel = null;
    }
    this.errorCount.clear();
  }

  /**
   * Shows the output channel to the user.
   * Useful for debugging or when user requests to see logs.
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  public showOutputChannel(): void {
    if (this.outputChannel) {
      this.outputChannel.show();
    }
  }
}

/**
 * Convenience function to get the ErrorHandler singleton instance.
 *
 * @returns The singleton ErrorHandler instance
 */
export function getErrorHandler(): ErrorHandler {
  return ErrorHandler.getInstance();
}
