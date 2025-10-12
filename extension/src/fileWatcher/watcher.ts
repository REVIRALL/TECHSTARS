import * as vscode from 'vscode';
import { ApiClient } from '../api/client';

export interface RecentChange {
  filePath: string;
  fileName: string;
  languageId: string;
  timestamp: number;
}

export class FileWatcher {
  private context: vscode.ExtensionContext;
  private apiClient: ApiClient;
  private recentChanges: RecentChange[] = [];

  constructor(context: vscode.ExtensionContext, apiClient: ApiClient) {
    this.context = context;
    this.apiClient = apiClient;
  }

  /**
   * 最近の変更履歴を取得
   */
  public getRecentChanges(): RecentChange[] {
    console.log('getRecentChanges called, returning', this.recentChanges.length, 'changes');
    console.log('Recent changes details:', JSON.stringify(this.recentChanges, null, 2));
    return this.recentChanges;
  }

  /**
   * 変更履歴をクリア
   */
  public clearRecentChanges(): void {
    this.recentChanges = [];
  }

  /**
   * ファイル監視開始
   */
  start(): void {
    // ファイル保存時のイベントリスナー
    vscode.workspace.onDidSaveTextDocument(
      async document => {
        await this.onFileSaved(document);
      },
      null,
      this.context.subscriptions
    );
  }

  /**
   * 最近の変更を記録
   */
  private addRecentChange(change: RecentChange): void {
    console.log('addRecentChange called:', change);

    // 同じファイルの重複を削除
    this.recentChanges = this.recentChanges.filter(c => c.filePath !== change.filePath);

    // 新しい変更を先頭に追加
    this.recentChanges.unshift(change);

    // 最大10件まで保持
    if (this.recentChanges.length > 10) {
      this.recentChanges = this.recentChanges.slice(0, 10);
    }

    console.log('Recent changes count:', this.recentChanges.length);
    console.log('Recent changes:', this.recentChanges);
  }

  /**
   * ファイル保存時の処理
   */
  private async onFileSaved(document: vscode.TextDocument): Promise<void> {
    console.log('File saved:', document.fileName, 'Language:', document.languageId);

    // サポート対象の言語かチェック
    if (!this.isSupportedLanguage(document.languageId)) {
      console.log('Language not supported:', document.languageId);
      return;
    }

    // 監視フォルダ設定を取得
    const config = vscode.workspace.getConfiguration('vibecoding');
    const watchFolders = config.get<string[]>('watchFolders', []);

    // 監視フォルダが設定されている場合のみ、そのフォルダ内のファイルを記録
    // 設定が空の場合は、何も記録しない（意図的に無視）
    if (watchFolders.length === 0) {
      console.log('No watch folders configured, skipping file tracking');
      return;
    }

    // パスを正規化して比較（Windows/Unix互換）
    const normalizedFilePath = document.uri.fsPath.replace(/\\/g, '/');
    const isInWatchFolder = watchFolders.some(folder => {
      const normalizedFolder = folder.replace(/\\/g, '/');
      return normalizedFilePath.startsWith(normalizedFolder);
    });

    if (!isInWatchFolder) {
      console.log('File not in watch folders:', normalizedFilePath);
      return;
    }

    console.log('File is in watch folder, adding to recent changes');

    console.log('Adding to recent changes:', document.fileName);

    // 変更履歴に追加
    this.addRecentChange({
      filePath: document.uri.fsPath,
      fileName: document.fileName.split('/').pop() || document.fileName.split('\\').pop() || 'unknown',
      languageId: document.languageId,
      timestamp: Date.now(),
    });
  }

  /**
   * ファイル解析実行
   */
  async analyzeFile(document: vscode.TextDocument): Promise<void> {
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
   * HTMLエスケープ（XSS対策）
   */
  private escapeHtml(text: string | undefined | null): string {
    if (!text) return '';
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '\\': '&#92;'
    };
    return String(text).replace(/[&<>"'\\]/g, (m) => map[m]);
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

    const explanation = data.explanation || {};

    // 安全にデータを取得（Null参照対策）
    const summary = this.escapeHtml(explanation.summary || 'N/A');
    const level = this.escapeHtml(explanation.level || 'beginner');
    const complexityScore = explanation.complexityScore || 'N/A';
    const content = this.escapeHtml(explanation.content || '解説がありません');
    const keyConcepts = Array.isArray(explanation.keyConcepts) ? explanation.keyConcepts : [];
    const isCached = data.cached === true;

    panel.webview.html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
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
  <h1>コード解説</h1>

  <div class="summary">
    <strong>要約:</strong> ${summary}
  </div>

  <div class="metadata">
    <span class="badge">レベル: ${level}</span>
    <span class="badge">複雑度: ${complexityScore}/10</span>
    ${isCached ? '<span class="badge" style="background: #28a745;">キャッシュ</span>' : '<span class="badge">新規解析</span>'}
  </div>

  ${keyConcepts.length > 0 ? `
  <div>
    <strong>重要な概念:</strong>
    <ul>
      ${keyConcepts.map((concept: string) => `<li><code>${this.escapeHtml(concept)}</code></li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="content">
    <h2>詳細解説</h2>
    <div>${content.replace(/\n/g, '<br>')}</div>
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
