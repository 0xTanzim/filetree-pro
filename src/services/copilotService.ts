import * as vscode from 'vscode';
import { CopilotAnalysis } from '../types';

export class CopilotService {
  private _isCopilotAvailable: boolean = false;
  private analysisCache = new Map<string, CopilotAnalysis>();

  constructor() {
    this.checkCopilotAvailability();
  }

  private async checkCopilotAvailability(): Promise<void> {
    try {
      const copilotExtension = vscode.extensions.getExtension('github.copilot');
      this._isCopilotAvailable = !!copilotExtension && copilotExtension.isActive;

      if (this._isCopilotAvailable) {
        console.log('GitHub Copilot is available and active');
      } else {
        console.log('GitHub Copilot is not available or not active');
      }
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

    const cacheKey = uri.fsPath;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey) || null;
    }

    try {
      const content = await this.getFileContent(uri);
      if (!content) {
        return null;
      }

      const analysis = await this.performAnalysis(uri, content);
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing file with Copilot:', error);
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
      // Use Copilot Chat API to analyze the file
      const response = await vscode.commands.executeCommand('github.copilot.chat', {
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Error calling Copilot Chat API:', error);
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

      const response = await vscode.commands.executeCommand('github.copilot.chat', {
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      if (typeof response === 'string') {
        return response.split('\n').filter(line => line.trim().length > 0);
      }

      return [];
    } catch (error) {
      console.error('Error getting project suggestions:', error);
      return [];
    }
  }

  async suggestFileOrganization(): Promise<string[]> {
    if (!this._isCopilotAvailable) {
      return [];
    }

    try {
      const prompt = `Based on the current project structure, suggest file organization improvements including:
1. Folder structure recommendations
2. File naming conventions
3. Separation of concerns
4. Module organization

Provide specific, actionable recommendations.`;

      const response = await vscode.commands.executeCommand('github.copilot.chat', {
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      if (typeof response === 'string') {
        return response.split('\n').filter(line => line.trim().length > 0);
      }

      return [];
    } catch (error) {
      console.error('Error getting file organization suggestions:', error);
      return [];
    }
  }

  clearCache(): void {
    this.analysisCache.clear();
  }

  dispose(): void {
    this.clearCache();
  }
}
