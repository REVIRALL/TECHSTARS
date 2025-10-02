import * as vscode from 'vscode';
import { ApiClient } from '../api/client';
import { ClaudeDetector, ClaudeDetectionResult } from './claudeDetector';

export class FileWatcher {
  private context: vscode.ExtensionContext;
  private apiClient: ApiClient;
  private claudeDetector: ClaudeDetector;
  private autoAnalyzeEnabled: boolean = true;
  private processingQueue: Set<string> = new Set();

  constructor(context: vscode.ExtensionContext, apiClient: ApiClient) {
    this.context = context;
    this.apiClient = apiClient;
    this.claudeDetector = new ClaudeDetector();

    // 設定読み込み
    const config = vscode.workspace.getConfiguration('vibecoding');
    this.autoAnalyzeEnabled = config.get('autoAnalyze', true);
  }

  /**
   * ファイル監視開始
   */
  start(): void {
    // ファイル保存時のイベントリスナー
    vscode.workspace.onDidSaveTextDocument(
      async document => {
        if (this.autoAnalyzeEnabled) {
          await this.onFileSaved(document);
        }
      },
      null,
      this.context.subscriptions
    );

    // 設定変更の監視
    vscode.workspace.onDidChangeConfiguration(
      e => {
        if (e.affectsConfiguration('vibecoding.autoAnalyze')) {
          const config = vscode.workspace.getConfiguration('vibecoding');
          this.autoAnalyzeEnabled = config.get('autoAnalyze', true);
        }
      },
      null,
      this.context.subscriptions
    );
  }

  /**
   * ファイル保存時の処理
   */
  private async onFileSaved(document: vscode.TextDocument): Promise<void> {
    // サポート対象の言語かチェック
    if (!this.isSupportedLanguage(document.languageId)) {
      return;
    }

    // 認証チェック
    const isAuthenticated = await this.apiClient.isAuthenticated();
    if (!isAuthenticated) {
      return; // 未ログインの場合は何もしない
    }

    // 重複処理防止
    const fileKey = document.uri.fsPath;
    if (this.processingQueue.has(fileKey)) {
      return;
    }

    try {
      this.processingQueue.add(fileKey);

      // Claude Code 検知
      const detection = await this.claudeDetector.detect(document);

      if (detection.isClaudeGenerated) {
        // Claude Code で生成されたファイル
        await this.handleClaudeGeneratedFile(document, detection);
      }
    } finally {
      this.processingQueue.delete(fileKey);
    }
  }

  /**
   * Claude Code生成ファイルの処理
   */
  private async handleClaudeGeneratedFile(
    document: vscode.TextDocument,
    detection: ClaudeDetectionResult
  ): Promise<void> {
    // 通知表示
    const action = await vscode.window.showInformationMessage(
      `Claude Code で生成されたファイルを検知しました: ${document.fileName}`,
      '解析する',
      '今回はスキップ'
    );

    if (action === '解析する') {
      await this.analyzeFile(document, detection);
    }
  }

  /**
   * ファイル解析実行
   */
  async analyzeFile(
    document: vscode.TextDocument,
    detection?: ClaudeDetectionResult
  ): Promise<void> {
    const code = document.getText();
    const language = this.mapLanguageId(document.languageId);

    // 解析レベル取得 (設定から)
    const config = vscode.workspace.getConfiguration('vibecoding');
    const level = config.get<'beginner' | 'intermediate' | 'advanced'>(
      'explanationLevel',
      'beginner'
    );

    // 解析中表示
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'コードを解析中...',
        cancellable: false,
      },
      async () => {
        try {
          const result = await this.apiClient.analyzeCode({
            code,
            language,
            level,
            fileName: document.fileName,
            filePath: document.uri.fsPath,
            isClaudeGenerated: detection?.isClaudeGenerated || false,
            detectionMethod: detection?.detectionMethod || 'manual',
          });

          if (result.success && result.data) {
            // 解説表示 (Webviewで)
            await this.showExplanation(result.data);

            vscode.window.showInformationMessage('解析完了!');
          } else {
            vscode.window.showErrorMessage(`解析失敗: ${result.error}`);
          }
        } catch (error) {
          vscode.window.showErrorMessage(`解析エラー: ${error}`);
        }
      }
    );
  }

  /**
   * 解説表示 (シンプル版)
   */
  private async showExplanation(data: any): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'vibecodingExplanation',
      'コード解説',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
      }
    );

    const explanation = data.explanation;

    panel.webview.html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>コード解説</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 20px;
      color: var(--vscode-foreground);
      line-height: 1.6;
    }
    h1 {
      border-bottom: 2px solid var(--vscode-textLink-foreground);
      padding-bottom: 10px;
    }
    .summary {
      background: var(--vscode-textBlockQuote-background);
      padding: 15px;
      border-left: 4px solid var(--vscode-textLink-foreground);
      margin: 20px 0;
    }
    .metadata {
      display: flex;
      gap: 20px;
      margin: 20px 0;
      font-size: 0.9em;
      color: var(--vscode-descriptionForeground);
    }
    .badge {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 4px 8px;
      border-radius: 4px;
    }
    .content {
      margin-top: 30px;
    }
    code {
      background: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <h1>📚 コード解説</h1>

  <div class="summary">
    <strong>要約:</strong> ${explanation.summary || 'N/A'}
  </div>

  <div class="metadata">
    <span class="badge">レベル: ${explanation.level}</span>
    <span class="badge">複雑度: ${explanation.complexityScore || 'N/A'}/10</span>
    ${
      data.cached
        ? '<span class="badge" style="background: #28a745;">キャッシュ</span>'
        : '<span class="badge">新規解析</span>'
    }
  </div>

  ${
    explanation.keyConcepts && explanation.keyConcepts.length > 0
      ? `
  <div>
    <strong>重要な概念:</strong>
    <ul>
      ${explanation.keyConcepts.map((concept: string) => `<li><code>${concept}</code></li>`).join('')}
    </ul>
  </div>
  `
      : ''
  }

  <div class="content">
    <h2>詳細解説</h2>
    <div>${explanation.content.replace(/\n/g, '<br>')}</div>
  </div>
</body>
</html>
    `;
  }

  /**
   * サポート対象言語チェック
   */
  private isSupportedLanguage(languageId: string): boolean {
    const supportedLanguages = [
      'javascript',
      'typescript',
      'python',
      'java',
      'go',
      'rust',
      'cpp',
      'c',
      'csharp',
      'php',
      'ruby',
      'html',
      'css',
    ];
    return supportedLanguages.includes(languageId);
  }

  /**
   * VSCode言語ID → バックエンド言語名マッピング
   */
  private mapLanguageId(languageId: string): string {
    const mapping: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      go: 'go',
      rust: 'rust',
      cpp: 'cpp',
      c: 'c',
      csharp: 'csharp',
      php: 'php',
      ruby: 'ruby',
      html: 'html',
      css: 'css',
    };
    return mapping[languageId] || languageId;
  }
}
