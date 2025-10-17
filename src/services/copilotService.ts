import * as vscode from 'vscode';
import { CopilotAnalysis } from '../types';
import { CacheManager, createCache } from '../utils/cacheManager';
import { ErrorCategory, ErrorSeverity, getErrorHandler } from '../utils/errorHandler';
import { validateFileSize, validatePath } from '../utils/securityUtils';

/**
 * Rate limiter using token bucket algorithm for API call throttling.
 * Prevents API abuse and respects rate limits.
 *
 * Time Complexity: O(1) for all operations
 * Space Complexity: O(1)
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number,
    private readonly refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Attempts to consume a token. Returns true if successful.
   * Automatically refills tokens based on time elapsed.
   */
  public tryConsume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Refills tokens based on time elapsed since last refill.
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Gets current token count (for monitoring).
   */
  public getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Copilot service with caching, rate limiting, and security validation.
 * Integrates with GitHub Copilot for AI-powered file analysis.
 *
 * @since 0.2.0
 */
export class CopilotService {
  private _isCopilotAvailable: boolean = false;
  private analysisCache: CacheManager<string, CopilotAnalysis>;
  private errorHandler = getErrorHandler();
  private timers: NodeJS.Timeout[] = []; // Track timers for cleanup

  // Rate limiter: 10 requests per minute (burst of 5)
  private rateLimiter: RateLimiter;

  // Request timeout: 30 seconds
  private readonly REQUEST_TIMEOUT = 30000;

  constructor() {
    this.checkCopilotAvailability();

    // Initialize cache: 50 entries, 10-minute TTL
    this.analysisCache = createCache<string, CopilotAnalysis>(50, 10);

    // Initialize rate limiter: 5 tokens max, refill 10/minute (0.167/second)
    this.rateLimiter = new RateLimiter(5, 10 / 60);
  }

  private async checkCopilotAvailability(): Promise<void> {
    try {
      const copilotExtension = vscode.extensions.getExtension('github.copilot');
      this._isCopilotAvailable = !!copilotExtension && copilotExtension.isActive;
    } catch (error) {
      console.error('Error checking Copilot availability:', error);
      this._isCopilotAvailable = false;
    }
  }

  isCopilotAvailable(): boolean {
    return this._isCopilotAvailable;
  }

  isAvailable(): boolean {
    return this._isCopilotAvailable;
  }

  async analyzeFile(uri: vscode.Uri): Promise<CopilotAnalysis | null> {
    if (!this._isCopilotAvailable) {
      return null;
    }

    // Validate path
    const pathValidation = validatePath(uri.fsPath);
    if (!pathValidation.valid) {
      await this.errorHandler.handleError(
        this.errorHandler.createSecurityError(
          `Invalid path for analysis: ${pathValidation.error}`,
          { path: uri.fsPath }
        )
      );
      return null;
    }

    // Check cache first
    const cacheKey = uri.fsPath;
    const cachedAnalysis = this.analysisCache.get(cacheKey);
    if (cachedAnalysis) {
      return cachedAnalysis;
    }

    // Check rate limit
    if (!this.rateLimiter.tryConsume()) {
      await this.errorHandler.handleError({
        message: 'Rate limit exceeded for Copilot API. Please wait and try again.',
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.API,
        context: { path: uri.fsPath, remainingTokens: this.rateLimiter.getTokens() },
        timestamp: new Date(),
      });
      return null;
    }

    try {
      // Check file size before reading
      const stat = await vscode.workspace.fs.stat(uri);
      const sizeValidation = validateFileSize(stat.size);
      if (!sizeValidation.valid) {
        await this.errorHandler.handleError({
          message: `File too large for analysis: ${sizeValidation.error}`,
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.SECURITY,
          context: { path: uri.fsPath, size: stat.size },
          timestamp: new Date(),
        });
        return null;
      }

      const content = await this.getFileContent(uri);
      if (!content) {
        return null;
      }

      const analysis = await this.performAnalysis(uri, content);

      // Cache the result
      this.analysisCache.set(cacheKey, analysis);

      return analysis;
    } catch (error) {
      await this.errorHandler.handleError(
        this.errorHandler.createApiError('Error analyzing file with Copilot', error as Error, {
          path: uri.fsPath,
        })
      );
      return null;
    }
  }

  private async getFileContent(uri: vscode.Uri): Promise<string> {
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(content).toString('utf8');
    } catch (error) {
      console.error('Error reading file content:', error);
      return '';
    }
  }

  private async performAnalysis(uri: vscode.Uri, content: string): Promise<CopilotAnalysis> {
    const fileName = uri.fsPath.split('/').pop() || '';
    const fileExtension = fileName.split('.').pop() || '';

    const prompt = this.buildAnalysisPrompt(fileName, fileExtension, content);

    try {
      // Create timeout promise with tracked timer
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Copilot API request timed out'));
        }, this.REQUEST_TIMEOUT);
        this.timers.push(timer); // Track timer
      });

      // Race between API call and timeout
      const response = await Promise.race([
        vscode.commands.executeCommand('github.copilot.chat', {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        timeoutPromise,
      ]);

      return this.parseAnalysisResponse(response);
    } catch (error) {
      await this.errorHandler.handleError(
        this.errorHandler.createApiError('Error calling Copilot Chat API', error as Error, {
          fileName,
          fileExtension,
        })
      );
      return this.generateFallbackAnalysis(content);
    }
  }

  private buildAnalysisPrompt(fileName: string, fileExtension: string, content: string): string {
    return `Please analyze this ${fileExtension} file and provide:

1. A brief summary of what this file does (1-2 sentences)
2. The complexity level (low/medium/high) based on code structure
3. 2-3 suggestions for improvement or refactoring
4. Any potential issues or best practices violations

File: ${fileName}
Content:
\`\`\`${fileExtension}
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}
\`\`\`

Please respond in JSON format:
{
  "summary": "brief description",
  "complexity": "low|medium|high",
  "suggestions": ["suggestion1", "suggestion2"],
  "issues": ["issue1", "issue2"]
}`;
  }

  private parseAnalysisResponse(response: any): CopilotAnalysis {
    try {
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            summary: parsed.summary,
            complexity: parsed.complexity,
            suggestions: parsed.suggestions,
            recommendations: parsed.issues,
          };
        }
      }

      // Fallback parsing
      return {
        summary: 'Analysis completed',
        complexity: 'medium',
        suggestions: ['Consider adding comments', 'Review code structure'],
      };
    } catch (error) {
      console.error('Error parsing Copilot response:', error);
      return {
        summary: 'Analysis completed',
        complexity: 'medium',
        suggestions: ['Consider adding comments', 'Review code structure'],
      };
    }
  }

  private generateFallbackAnalysis(content: string): CopilotAnalysis {
    const lines = content.split('\n').length;
    const complexity = lines > 100 ? 'high' : lines > 50 ? 'medium' : 'low';

    return {
      summary: `File contains ${lines} lines of code`,
      complexity,
      suggestions: ['Consider adding documentation', 'Review for potential optimizations'],
    };
  }

  getFileAnalysis(uri: vscode.Uri): CopilotAnalysis | null {
    return this.analysisCache.get(uri.fsPath) || null;
  }

  async getProjectSuggestions(): Promise<string[]> {
    if (!this._isCopilotAvailable) {
      return [];
    }

    // Check rate limit
    if (!this.rateLimiter.tryConsume()) {
      await this.errorHandler.handleError({
        message: 'Rate limit exceeded for Copilot API',
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.API,
        timestamp: new Date(),
      });
      return [];
    }

    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return [];
      }

      const prompt = `Analyze this project structure and provide 3-5 suggestions for:
1. File organization improvements
2. Naming conventions
3. Project structure optimization
4. Best practices recommendations

Please provide specific, actionable suggestions.`;

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Request timed out')),
          this.REQUEST_TIMEOUT
        );
        this.timers.push(timer);
      });

      const response = await Promise.race([
        vscode.commands.executeCommand('github.copilot.chat', {
          messages: [{ role: 'user', content: prompt }],
        }),
        timeoutPromise,
      ]);

      if (typeof response === 'string') {
        return response.split('\n').filter(line => line.trim().length > 0);
      }

      return [];
    } catch (error) {
      await this.errorHandler.handleError(
        this.errorHandler.createApiError('Error getting project suggestions', error as Error)
      );
      return [];
    }
  }

  async suggestFileOrganization(): Promise<string[]> {
    if (!this._isCopilotAvailable) {
      return [];
    }

    // Check rate limit
    if (!this.rateLimiter.tryConsume()) {
      await this.errorHandler.handleError({
        message: 'Rate limit exceeded for Copilot API',
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.API,
        timestamp: new Date(),
      });
      return [];
    }

    try {
      const prompt = `Based on the current project structure, suggest file organization improvements including:
1. Folder structure recommendations
2. File naming conventions
3. Separation of concerns
4. Module organization

Provide specific, actionable recommendations.`;

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Request timed out')),
          this.REQUEST_TIMEOUT
        );
        this.timers.push(timer);
      });

      const response = await Promise.race([
        vscode.commands.executeCommand('github.copilot.chat', {
          messages: [{ role: 'user', content: prompt }],
        }),
        timeoutPromise,
      ]);

      if (typeof response === 'string') {
        return response.split('\n').filter(line => line.trim().length > 0);
      }

      return [];
    } catch (error) {
      await this.errorHandler.handleError(
        this.errorHandler.createApiError(
          'Error getting file organization suggestions',
          error as Error
        )
      );
      return [];
    }
  }

  clearCache(): void {
    const cleared = this.analysisCache.clear();
    console.log(`[CopilotService] Cleared ${cleared} cache entries`);
  }

  dispose(): void {
    // Clear all pending timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];

    // Clear cache
    this.clearCache();
  }
}
