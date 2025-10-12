import * as vscode from 'vscode';
import { ApiClient } from '../api/client';
import { FileWatcher } from '../fileWatcher/watcher';

export class LearningPanelProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly apiClient: ApiClient,
    private readonly fileWatcher: FileWatcher
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════════════');
    console.log('║ 🎉 [LearningPanel] resolveWebviewView CALLED!');
    console.log('╟───────────────────────────────────────────────────────────────────────');
    console.log('║ This method is called when VSCode needs to display the webview');
    console.log('║ If you see this, the provider is correctly registered!');
    console.log('╟───────────────────────────────────────────────────────────────────────');
    console.log('║ Parameters:');
    console.log('║   - webviewView:', !!webviewView);
    console.log('║   - webviewView.viewType:', webviewView?.viewType);
    console.log('║   - webviewView.webview:', !!webviewView?.webview);
    console.log('║   - context:', !!_context);
    console.log('║   - token:', !!_token);
    console.log('╚═══════════════════════════════════════════════════════════════════════');
    console.log('');

    this.view = webviewView;
    console.log('[LearningPanel] Setting this.view =', !!this.view);

    console.log('[LearningPanel] Setting webview options...');
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    console.log('[LearningPanel] ✅ Webview options set');

    console.log('[LearningPanel] Generating HTML content...');
    const htmlContent = this.getHtmlContent();
    console.log('[LearningPanel] HTML length:', htmlContent.length, 'chars');
    webviewView.webview.html = htmlContent;
    console.log('[LearningPanel] ✅ HTML content set to webview');

    // メッセージハンドラー
    console.log('[LearningPanel] Setting up message handler...');
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'analyzeSelection':
          await this.analyzeSelection();
          break;
        case 'analyzeRecentChanges':
          await this.analyzeRecentChanges();
          break;
        case 'showHistory':
          await this.showHistory();
          break;
        case 'refresh':
          await this.refresh();
          break;
        case 'addWatchFolder':
          await this.addWatchFolder();
          break;
        case 'removeWatchFolder':
          await this.removeWatchFolder(message.path);
          break;
        case 'analyzeFile':
          await this.analyzeFile(message.filePath);
          break;
        case 'signup':
          vscode.commands.executeCommand('vibecoding.signup');
          break;
        case 'login':
          vscode.commands.executeCommand('vibecoding.login');
          break;
        case 'logout':
          vscode.commands.executeCommand('vibecoding.logout');
          break;
      }
    });
    console.log('[LearningPanel] ✅ Message handler registered');

    // 初期データロード
    console.log('[LearningPanel] Calling refresh() to load initial data...');
    this.refresh();
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════════════');
    console.log('║ ✅ [LearningPanel] resolveWebviewView COMPLETED SUCCESSFULLY!');
    console.log('║ The webview should now be visible in the sidebar');
    console.log('╚═══════════════════════════════════════════════════════════════════════');
    console.log('');
  }

  private async analyzeSelection() {
    console.log('┌─ [LearningPanel] Analyze Selection ────');

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.log('│ ❌ No active editor');
      console.log('└────────────────────────────────────────');
      vscode.window.showWarningMessage('アクティブなファイルがありません');
      return;
    }

    // 認証チェック
    const isAuth = await this.apiClient.isAuthenticated();
    console.log('│ Authenticated:', isAuth);
    if (!isAuth) {
      console.log('│ ❌ Not authenticated, showing login');
      console.log('└────────────────────────────────────────');
      vscode.window.showWarningMessage('ログインが必要です');
      vscode.commands.executeCommand('vibecoding.login');
      return;
    }

    const selection = editor.selection;
    let codeToAnalyze = editor.document.getText(selection);

    // 選択がない、または空の場合はファイル全体を解析
    if (!codeToAnalyze || codeToAnalyze.trim() === '') {
      console.log('│ No selection, using whole file');
      codeToAnalyze = editor.document.getText();
      if (!codeToAnalyze || codeToAnalyze.trim() === '') {
        console.log('│ ❌ File is empty');
        console.log('└────────────────────────────────────────');
        vscode.window.showWarningMessage('ファイルが空です');
        return;
      }
    }

    console.log('│ Code length:', codeToAnalyze.length, 'chars');
    console.log('│ Language:', editor.document.languageId);
    console.log('└────────────────────────────────────────');

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'コードを解析中...',
        cancellable: false,
      },
      async (progress) => {
        const languageId = editor.document.languageId;
        const fileName = editor.document.fileName.split('/').pop() || editor.document.fileName.split('\\').pop() || 'file.txt';

        // 進捗表示を更新
        progress.report({ message: 'AIサーバーに送信中...' });

        console.log('┌─ [LearningPanel] Calling API ──────────');

        // タイムアウト警告タイマー（設定値の1/4または45秒のいずれか小さい方）
        const config = vscode.workspace.getConfiguration('vibecoding');
        const timeout = config.get<number>('requestTimeout', 600000);
        const warningDelay = Math.min(timeout / 4, 45000);

        const warningTimer = setTimeout(() => {
          progress.report({
            message: `サーバーが応答を処理中です... (設定タイムアウト: ${timeout / 1000}秒)`
          });
        }, warningDelay);

        const result = await this.apiClient.analyzeCode({
          code: codeToAnalyze,
          language: languageId,
          fileName,
          level: 'intermediate',
        });

        clearTimeout(warningTimer);

        console.log('│ API returned, success:', result.success);
        console.log('│ Has data:', !!result.data);
        console.log('│ Has explanation:', !!result.data?.explanation);

        if (result.success && result.data) {
          console.log('│ ✅ Sending explanation to webview');
          console.log('│ Explanation preview:', JSON.stringify({
            summary: result.data.explanation?.summary?.substring(0, 50),
            content_length: result.data.explanation?.content?.length || 0,
            level: result.data.explanation?.level
          }));

          this.view?.webview.postMessage({
            command: 'showExplanation',
            data: result.data,
          });
          console.log('│ ✅ Message sent');
          console.log('└────────────────────────────────────────');
          vscode.window.showInformationMessage('解説を生成しました');
        } else {
          const errorMsg = result.error || result.message || '不明なエラーが発生しました';
          console.error('│ ❌ Analysis failed:', errorMsg);
          console.error('│ Full result:', JSON.stringify(result, null, 2).substring(0, 300));
          console.error('└────────────────────────────────────────');
          vscode.window.showErrorMessage(`解析に失敗しました: ${errorMsg}`);
        }
      }
    );
  }

  private async showHistory() {
    try {
      console.log('┌─ [LearningPanel] Fetching History ─────');
      const result = await this.apiClient.getAnalysisHistory({ limit: 10 });

      console.log('│ API Success:', result.success);
      console.log('│ Has data:', !!result.data);
      console.log('│ Has analyses:', !!result.data?.analyses);
      console.log('│ Analyses length:', result.data?.analyses?.length || 0);

      if (result.success && result.data?.analyses) {
        console.log('│ ✅ Sending to webview:', result.data.analyses.length, 'items');

        // 最初の3件だけログ出力（デバッグ用）
        const preview = result.data.analyses.slice(0, 3).map((a: any) => ({
          id: a.id?.substring(0, 8),
          file_name: a.file_name,
          language: a.language,
          has_explanations: !!a.explanations
        }));
        console.log('│ Preview:', JSON.stringify(preview, null, 2));

        this.view?.webview.postMessage({
          command: 'updateHistory',
          data: result.data.analyses,
        });
        console.log('│ ✅ Message sent to webview');
      } else {
        console.error('│ ❌ Failed - result:', {
          success: result.success,
          error: result.error,
          hasData: !!result.data
        });
        this.view?.webview.postMessage({
          command: 'updateHistory',
          data: [],
        });
      }
      console.log('└────────────────────────────────────────');
    } catch (error) {
      console.error('┌─ [LearningPanel] ❌ History Error ─────');
      console.error('│', error);
      console.error('└────────────────────────────────────────');
      this.view?.webview.postMessage({
        command: 'updateHistory',
        data: [],
      });
    }
  }

  private async analyzeRecentChanges() {
    const recentChanges = this.fileWatcher.getRecentChanges();
    console.log('analyzeRecentChanges called, recent changes:', recentChanges);

    if (recentChanges.length === 0) {
      vscode.window.showInformationMessage('最近の変更はありません。ファイルを保存すると記録されます。');
      return;
    }

    // 認証チェック
    const isAuth = await this.apiClient.isAuthenticated();
    if (!isAuth) {
      vscode.window.showWarningMessage('ログインが必要です');
      vscode.commands.executeCommand('vibecoding.login');
      return;
    }

    // 確認ダイアログ
    const action = await vscode.window.showInformationMessage(
      `${recentChanges.length}件のファイルを解析しますか？`,
      '解析する',
      'キャンセル'
    );

    if (action !== '解析する') {
      return;
    }

    // 一括解析
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `${recentChanges.length}件のファイルを解析中...`,
        cancellable: false,
      },
      async (progress) => {
        let completed = 0;

        for (const change of recentChanges) {
          progress.report({
            message: `${completed + 1}/${recentChanges.length}: ${change.fileName} を解析中...`,
          });

          try {
            const document = await vscode.workspace.openTextDocument(change.filePath);
            const code = document.getText();

            const config = vscode.workspace.getConfiguration('vibecoding');
            const level = config.get<'beginner' | 'intermediate' | 'advanced'>(
              'explanationLevel',
              'intermediate'
            );

            // タイムアウト警告タイマー
            const timeoutConfig = vscode.workspace.getConfiguration('vibecoding');
            const requestTimeout = timeoutConfig.get<number>('requestTimeout', 600000);
            const warningDelay = Math.min(requestTimeout / 4, 45000);

            const warningTimer = setTimeout(() => {
              progress.report({
                message: `${completed + 1}/${recentChanges.length}: ${change.fileName} - サーバー処理中... (タイムアウト: ${requestTimeout / 1000}秒)`
              });
            }, warningDelay);

            await this.apiClient.analyzeCode({
              code,
              language: change.languageId,
              fileName: change.fileName,
              level,
            });

            clearTimeout(warningTimer);
            completed++;
          } catch (error) {
            console.error(`Failed to analyze ${change.fileName}:`, error);
            // エラーが発生してもカウントを増やして次に進む
            completed++;
          }
        }

        vscode.window.showInformationMessage(`${completed}件のファイル解析が完了しました`);
        this.fileWatcher.clearRecentChanges();
        await this.showHistory();
      }
    );
  }

  private async addWatchFolder() {
    console.log('addWatchFolder handler called');

    const options: vscode.OpenDialogOptions = {
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: '監視フォルダを選択',
    };

    try {
      const folderUri = await vscode.window.showOpenDialog(options);
      console.log('Selected folder:', folderUri);

      if (folderUri && folderUri[0]) {
        const config = vscode.workspace.getConfiguration('vibecoding');
        const currentFolders = config.get<string[]>('watchFolders', []);
        const newFolder = folderUri[0].fsPath;

        if (!currentFolders.includes(newFolder)) {
          await config.update('watchFolders', [...currentFolders, newFolder], vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(`フォルダを追加しました: ${newFolder}`);
          await this.refresh();
        } else {
          vscode.window.showWarningMessage('このフォルダは既に追加されています');
        }
      }
    } catch (error) {
      console.error('Error in addWatchFolder:', error);
      vscode.window.showErrorMessage(`エラー: ${error}`);
    }
  }

  private async removeWatchFolder(path: string) {
    const config = vscode.workspace.getConfiguration('vibecoding');
    const currentFolders = config.get<string[]>('watchFolders', []);
    const updatedFolders = currentFolders.filter(f => f !== path);

    await config.update('watchFolders', updatedFolders, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage('フォルダを削除しました');
    await this.refresh();
  }

  private async analyzeFile(filePath: string) {
    // 認証チェック
    const isAuth = await this.apiClient.isAuthenticated();
    if (!isAuth) {
      vscode.window.showWarningMessage('ログインが必要です');
      vscode.commands.executeCommand('vibecoding.login');
      return;
    }

    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const code = document.getText();

      const config = vscode.workspace.getConfiguration('vibecoding');
      const level = config.get<'beginner' | 'intermediate' | 'advanced'>(
        'explanationLevel',
        'beginner'
      );

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'コードを解析中...',
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: 'AIサーバーに送信中...' });

          // タイムアウト警告タイマー
          const config = vscode.workspace.getConfiguration('vibecoding');
          const timeout = config.get<number>('requestTimeout', 600000);
          const warningDelay = Math.min(timeout / 4, 45000);

          const warningTimer = setTimeout(() => {
            progress.report({
              message: `サーバーが応答を処理中です... (タイムアウト: ${timeout / 1000}秒)`
            });
          }, warningDelay);

          const result = await this.apiClient.analyzeCode({
            code,
            language: document.languageId,
            fileName: filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown',
            level,
          });

          clearTimeout(warningTimer);

          if (result.success && result.data) {
            this.view?.webview.postMessage({
              command: 'showExplanation',
              data: result.data,
            });
            vscode.window.showInformationMessage('解説を生成しました');
          } else {
            const errorMsg = result.error || '解析に失敗しました';
            vscode.window.showErrorMessage(errorMsg);
          }
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(`エラー: ${error}`);
    }
  }

  public async refresh() {
    console.log('┌─ [LearningPanel] Refresh Started ──────');

    // ローディング表示を送信
    this.view?.webview.postMessage({
      command: 'setLoading',
      loading: true,
    });

    try {
      const isAuth = await this.apiClient.isAuthenticated();
      const recentChanges = this.fileWatcher.getRecentChanges();
      const config = vscode.workspace.getConfiguration('vibecoding');
      const watchFolders = config.get<string[]>('watchFolders', []);

      this.view?.webview.postMessage({
        command: 'updateAuth',
        isAuthenticated: isAuth,
      });

      this.view?.webview.postMessage({
        command: 'updateRecentChanges',
        recentChanges,
      });

      this.view?.webview.postMessage({
        command: 'updateWatchFolders',
        watchFolders,
      });

      if (isAuth) {
        await this.showHistory();
      }

      console.log('│ ✅ Refresh completed successfully');
      vscode.window.showInformationMessage('更新しました');
    } catch (error) {
      console.error('│ ❌ Refresh failed:', error);
      vscode.window.showErrorMessage('更新に失敗しました');
    } finally {
      // ローディング解除
      this.view?.webview.postMessage({
        command: 'setLoading',
        loading: false,
      });
      console.log('└────────────────────────────────────────');
    }
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private getHtmlContent(): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>TECHSTARS</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
      color: var(--vscode-foreground);
      padding: 0;
      line-height: 1.6;
      background: var(--vscode-sideBar-background);
    }
    .container {
      padding: 20px 16px;
    }
    h3 {
      margin: 0 0 16px 0;
      font-size: 11px;
      font-weight: 700;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      opacity: 0.85;
    }
    .action-button {
      width: 100%;
      padding: 11px 16px;
      margin: 8px 0;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      position: relative;
      overflow: hidden;
    }
    .action-button::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
      transition: left 0.5s;
    }
    .action-button:hover::before {
      left: 100%;
    }
    .action-button:hover {
      background: var(--vscode-button-hoverBackground);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .action-button:active {
      transform: translateY(0);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .secondary-button {
      background: transparent;
      color: var(--vscode-button-secondaryForeground);
      box-shadow: none;
      border: 1.5px solid var(--vscode-panel-border);
    }
    .secondary-button:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: var(--vscode-textLink-foreground);
      transform: none;
      box-shadow: none;
    }
    .primary-action {
      background: linear-gradient(135deg, #0098ff 0%, #0066cc 100%);
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .primary-action:hover {
      background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
    }
    .success-action {
      background: linear-gradient(135deg, #00d084 0%, #00a86b 100%);
      font-weight: 700;
    }
    .success-action:hover {
      background: linear-gradient(135deg, #00a86b 0%, #008556 100%);
    }
    .explanation-box {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 10px;
      padding: 16px;
      margin: 12px 0;
      white-space: pre-wrap;
      font-size: 12px;
      line-height: 1.7;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
      max-height: 500px;
      overflow-y: auto;
    }
    .explanation-box.collapsed {
      max-height: 150px;
      position: relative;
      overflow: hidden;
    }
    .explanation-box.collapsed::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 80px;
      background: linear-gradient(to bottom, transparent, var(--vscode-editor-background));
    }
    .toggle-btn {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 6px 12px;
      margin-top: 10px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .toggle-btn:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: var(--vscode-textLink-foreground);
    }
    .toggle-icon {
      transition: transform 0.2s ease;
    }
    .toggle-icon.expanded {
      transform: rotate(180deg);
    }
    .history-item,
    .file-item {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 10px;
      padding: 14px;
      margin: 8px 0;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .history-item-header {
      cursor: pointer;
    }
    .history-item-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
      margin-top: 0;
    }
    .history-item-content.expanded {
      max-height: 400px;
      overflow-y: auto;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--vscode-panel-border);
    }
    .history-item-text {
      font-size: 11px;
      line-height: 1.6;
      color: var(--vscode-descriptionForeground);
      white-space: pre-wrap;
    }
    .history-item::before,
    .file-item::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #0098ff 0%, #00d084 100%);
      transform: scaleY(0);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 0 4px 4px 0;
    }
    .history-item:hover,
    .file-item:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: rgba(0, 152, 255, 0.4);
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .history-item:hover::before,
    .file-item:hover::before {
      transform: scaleY(1);
    }
    .history-title,
    .file-name {
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--vscode-textLink-foreground);
      font-size: 13px;
      letter-spacing: 0.2px;
    }
    .history-meta,
    .file-meta {
      font-size: 11px;
      opacity: 0.65;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }
    .history-meta-left {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .toggle-arrow {
      font-weight: bold;
      font-size: 12px;
      transition: transform 0.2s ease;
      user-select: none;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: linear-gradient(135deg, rgba(0, 152, 255, 0.15) 0%, rgba(0, 208, 132, 0.15) 100%);
      color: var(--vscode-textLink-foreground);
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      border: 1px solid rgba(0, 152, 255, 0.2);
    }
    .folder-item {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 12px 14px;
      margin: 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .folder-item:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: rgba(0, 152, 255, 0.3);
      transform: translateX(2px);
    }
    .folder-path {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--vscode-editor-font-family);
      font-size: 11.5px;
    }
    .remove-btn {
      background: linear-gradient(135deg, #ff4757 0%, #e84118 100%);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 5px 12px;
      cursor: pointer;
      font-size: 10px;
      font-weight: 700;
      margin-left: 12px;
      transition: all 0.2s ease;
      letter-spacing: 0.3px;
    }
    .remove-btn:hover {
      background: linear-gradient(135deg, #e84118 0%, #c23616 100%);
      transform: scale(1.08);
      box-shadow: 0 3px 8px rgba(255, 71, 87, 0.3);
    }
    .empty-message {
      opacity: 0.45;
      font-size: 12px;
      text-align: center;
      padding: 32px 16px;
      font-style: italic;
      color: var(--vscode-descriptionForeground);
    }
    .not-logged-in {
      text-align: center;
      padding: 40px 20px;
    }
    .welcome-text {
      opacity: 0.75;
      margin: 20px 0 32px 0;
      font-size: 13px;
      line-height: 1.8;
      color: var(--vscode-descriptionForeground);
    }
    .section {
      margin: 28px 0;
    }
    .section:first-child {
      margin-top: 0;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--vscode-panel-border), transparent);
      margin: 24px 0;
      opacity: 0.6;
    }
    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 8px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 11px;
      font-size: 11px;
      font-weight: 800;
      margin-left: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .brand-header {
      text-align: center;
      margin-bottom: 32px;
      padding: 20px 0;
      background: linear-gradient(135deg, rgba(0, 152, 255, 0.08) 0%, rgba(0, 208, 132, 0.08) 100%);
      border-radius: 12px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #0098ff 0%, #00d084 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .scrollable-content {
      padding-bottom: 80px;
    }
    .footer-section {
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--vscode-sideBar-background);
      padding: 12px 16px 16px 16px;
      border-top: 2px solid var(--vscode-panel-border);
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
      z-index: 100;
      backdrop-filter: blur(10px);
    }
    .logout-button {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
      color: white;
      margin: 0;
      font-weight: 700;
      letter-spacing: 0.3px;
      box-shadow: 0 3px 10px rgba(255, 107, 107, 0.3);
    }
    .logout-button:hover {
      background: linear-gradient(135deg, #ee5a6f 0%, #e74c5d 100%);
      box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
      transform: translateY(-2px);
    }
    .logout-button::before {
      content: "🚪 ";
    }
  </style>
</head>
<body>
  <div id="content" class="container">
    <div id="not-logged-in" style="display: none;">
      <div class="not-logged-in">
        <div class="brand-header">
          <div class="brand-title">TECHSTARS</div>
        </div>
        <p class="welcome-text">ログインまたは新規登録して<br>学習を始めましょう</p>
        <button class="action-button primary-action" id="login-btn">ログイン</button>
        <button class="action-button secondary-button" id="signup-btn">新規登録</button>
      </div>
    </div>

    <div id="logged-in" style="display: none;">
      <div class="scrollable-content">
        <div class="section">
          <h3>クイックアクション</h3>
          <button class="action-button primary-action" id="analyze-selection-btn">選択コードを解析</button>
          <button class="action-button success-action" id="analyze-recent-btn">
            最近の変更を解析<span class="count-badge" id="recent-count">0</span>
          </button>
          <button class="action-button secondary-button" id="refresh-btn">更新</button>
        </div>

        <div class="divider"></div>

        <div class="section">
          <h3>監視フォルダ</h3>
          <button class="action-button secondary-button" id="add-watch-folder-btn">+ フォルダを追加</button>
          <div id="watch-folders-list" style="margin-top: 10px;"></div>
        </div>

        <div class="divider"></div>

        <div class="section" id="recent-changes-section" style="display: none;">
          <h3>最近の変更</h3>
          <div id="recent-changes-list"></div>
        </div>

        <div class="section" id="explanation-section" style="display: none;">
          <h3>解説</h3>
          <div id="explanation-content" class="explanation-box collapsed"></div>
          <button id="explanation-toggle-btn" class="toggle-btn">
            <span class="toggle-icon">▼</span>
            <span id="explanation-toggle-text">全て表示</span>
          </button>
        </div>

        <div class="section">
          <h3>最近の解析</h3>
          <div id="history-list"></div>
        </div>
      </div>

      <div class="footer-section">
        <button class="action-button logout-button" id="logout-btn">ログアウト</button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}" type="module">
${this.getScript()}
  </script>
</body>
</html>`;
  }

  private getScript(): string {
    // IMPORTANT: String.raw を使用してバックスラッシュエスケープ問題を回避
    const scriptContent = String.raw`
(function() {
  const vscode = acquireVsCodeApi();
  let isAuthenticated = false;
  let recentChanges = [];
  let watchFolders = [];

  // HTMLエスケープ関数
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  console.log('┌─ [Webview] Initialized ────────────────');
  console.log('│ vscode API acquired');
  console.log('└────────────────────────────────────────');

  window.addEventListener('message', function(event) {
    const message = event.data;

    console.log('┌─ [Webview] Message Received ───────────');
    console.log('│ Command:', message.command);

    switch (message.command) {
      case 'updateAuth':
        console.log('│ isAuthenticated:', message.isAuthenticated);
        isAuthenticated = message.isAuthenticated;
        updateAuthUI();
        break;
      case 'updateRecentChanges':
        console.log('│ Recent changes count:', message.recentChanges?.length || 0);
        recentChanges = message.recentChanges || [];
        updateRecentChanges();
        break;
      case 'updateWatchFolders':
        console.log('│ Watch folders count:', message.watchFolders?.length || 0);
        watchFolders = message.watchFolders || [];
        updateWatchFolders();
        break;
      case 'showExplanation':
        console.log('│ Has explanation data:', !!message.data);
        console.log('│ Data keys:', Object.keys(message.data || {}));
        showExplanation(message.data);
        break;
      case 'updateHistory':
        console.log('│ History items count:', message.data?.length || 0);
        if (message.data && message.data.length > 0) {
          console.log('│ First item:', JSON.stringify({
            file_name: message.data[0].file_name,
            language: message.data[0].language,
            has_explanations: !!message.data[0].explanations
          }));
        }
        updateHistory(message.data);
        break;
      case 'setLoading':
        console.log('│ Loading:', message.loading);
        setLoadingState(message.loading);
        break;
    }
    console.log('└────────────────────────────────────────');
  });

  function updateAuthUI() {
    document.getElementById('not-logged-in').style.display = isAuthenticated ? 'none' : 'block';
    document.getElementById('logged-in').style.display = isAuthenticated ? 'block' : 'none';
  }

  function setLoadingState(loading) {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      if (loading) {
        refreshBtn.disabled = true;
        refreshBtn.style.opacity = '0.5';
        refreshBtn.textContent = '更新中...';
      } else {
        refreshBtn.disabled = false;
        refreshBtn.style.opacity = '1';
        refreshBtn.textContent = '更新';
      }
    }
  }

  // イベントリスナー設定
  function setupEventListeners() {
    // ログイン画面のボタン
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');

    if (loginBtn) {
      loginBtn.addEventListener('click', function() {
        vscode.postMessage({ command: 'login' });
      });
    }

    if (signupBtn) {
      signupBtn.addEventListener('click', function() {
        vscode.postMessage({ command: 'signup' });
      });
    }

    // ログイン後のボタン
    const analyzeSelectionBtn = document.getElementById('analyze-selection-btn');
    const analyzeRecentBtn = document.getElementById('analyze-recent-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const addWatchFolderBtn = document.getElementById('add-watch-folder-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (analyzeSelectionBtn) {
      analyzeSelectionBtn.addEventListener('click', function() {
        vscode.postMessage({ command: 'analyzeSelection' });
      });
    }

    if (analyzeRecentBtn) {
      analyzeRecentBtn.addEventListener('click', function() {
        vscode.postMessage({ command: 'analyzeRecentChanges' });
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        vscode.postMessage({ command: 'refresh' });
      });
    }

    if (addWatchFolderBtn) {
      addWatchFolderBtn.addEventListener('click', function() {
        console.log('addWatchFolder clicked');
        vscode.postMessage({ command: 'addWatchFolder' });
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        vscode.postMessage({ command: 'logout' });
      });
    }

    // 解説トグルボタン
    const explanationToggleBtn = document.getElementById('explanation-toggle-btn');
    if (explanationToggleBtn) {
      explanationToggleBtn.addEventListener('click', function() {
        const explanationContent = document.getElementById('explanation-content');
        const toggleIcon = explanationToggleBtn.querySelector('.toggle-icon');
        const toggleText = document.getElementById('explanation-toggle-text');

        if (explanationContent.classList.contains('collapsed')) {
          explanationContent.classList.remove('collapsed');
          toggleIcon.classList.add('expanded');
          toggleText.textContent = '折りたたむ';
        } else {
          explanationContent.classList.add('collapsed');
          toggleIcon.classList.remove('expanded');
          toggleText.textContent = '全て表示';
        }
      });
    }
  }

  // DOMの準備ができたらイベントリスナーを設定
  setupEventListeners();

  function removeWatchFolder(path) {
    vscode.postMessage({ command: 'removeWatchFolder', path: path });
  }

  function updateWatchFolders() {
    const listEl = document.getElementById('watch-folders-list');

    if (watchFolders.length === 0) {
      listEl.innerHTML = '<div class="empty-message">監視フォルダが設定されていません</div>';
      return;
    }

    listEl.innerHTML = watchFolders.map(function(folder, index) {
      return '<div class="folder-item">' +
        '<span class="folder-path" title="' + escapeHtml(folder) + '">' + escapeHtml(folder) + '</span>' +
        '<button class="remove-btn" data-index="' + index + '">削除</button>' +
      '</div>';
    }).join('');

    const removeButtons = listEl.querySelectorAll('.remove-btn');
    removeButtons.forEach(function(btn, index) {
      btn.addEventListener('click', function() {
        removeWatchFolder(watchFolders[index]);
      });
    });
  }

  function updateRecentChanges() {
    console.log('[updateRecentChanges] Called with', recentChanges.length, 'items');
    const countEl = document.getElementById('recent-count');
    const sectionEl = document.getElementById('recent-changes-section');
    const listEl = document.getElementById('recent-changes-list');
    const btnEl = document.getElementById('analyze-recent-btn');

    countEl.textContent = recentChanges.length;

    if (recentChanges.length === 0) {
      sectionEl.style.display = 'none';
      btnEl.style.opacity = '0.5';
      btnEl.disabled = true;
      return;
    }

    btnEl.style.opacity = '1';
    btnEl.disabled = false;
    sectionEl.style.display = 'block';

    listEl.innerHTML = recentChanges.map(function(change, index) {
      const date = new Date(change.timestamp).toLocaleTimeString('ja-JP');
      return '<div class="file-item" data-index="' + index + '">' +
        '<div class="file-name">' + escapeHtml(change.fileName) + '</div>' +
        '<div class="file-meta">' +
          '<span class="badge">' + escapeHtml(change.languageId) + '</span>' +
          '<span>' + escapeHtml(date) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    console.log('[updateRecentChanges] Added', recentChanges.length, 'file items to DOM');

    listEl.onclick = function(event) {
      const item = event.target.closest('.file-item');
      if (!item) return;

      const index = parseInt(item.getAttribute('data-index'), 10);
      console.log('[updateRecentChanges] Clicked file item', index, recentChanges[index]?.filePath);

      vscode.postMessage({
        command: 'analyzeFile',
        filePath: recentChanges[index].filePath
      });
    };
  }

  function showExplanation(data) {
    console.log('┌─ [Webview] showExplanation ────────────');
    console.log('│ Input data:', data);

    const section = document.getElementById('explanation-section');
    const content = document.getElementById('explanation-content');
    const toggleBtn = document.getElementById('explanation-toggle-btn');
    const toggleIcon = toggleBtn ? toggleBtn.querySelector('.toggle-icon') : null;
    const toggleText = document.getElementById('explanation-toggle-text');

    const explanation = data.explanation || data;
    console.log('│ Explanation object:', {
      has_summary: !!explanation.summary,
      has_content: !!explanation.content,
      summary_length: explanation.summary?.length || 0,
      content_length: explanation.content?.length || 0
    });

    let text = '';
    if (explanation.summary) {
      text = explanation.summary + '\n\n' + (explanation.content || '');
    } else {
      text = explanation.content || '解説を生成しました';
    }

    console.log('│ Final text length:', text.length);
    console.log('│ Text preview:', text.substring(0, 100));

    content.innerHTML = text.replace(/\n/g, '<br>');

    // 初期状態を折りたたみにリセット
    content.classList.add('collapsed');
    if (toggleIcon) toggleIcon.classList.remove('expanded');
    if (toggleText) toggleText.textContent = '全て表示';

    section.style.display = 'block';
    console.log('│ ✅ Explanation displayed');
    console.log('└────────────────────────────────────────');
  }

  function updateHistory(analyses) {
    console.log('┌─ [Webview] updateHistory ──────────────');
    console.log('│ Analyses count:', analyses?.length || 0);

    const historyList = document.getElementById('history-list');

    if (!analyses || analyses.length === 0) {
      console.log('│ No analyses, showing empty message');
      historyList.innerHTML = '<div class="empty-message">履歴がありません</div>';
      console.log('└────────────────────────────────────────');
      return;
    }

    console.log('│ Rendering', analyses.length, 'items');
    console.log('│ First item details:', {
      file_name: analyses[0].file_name,
      language: analyses[0].language,
      created_at: analyses[0].created_at,
      has_explanations: !!analyses[0].explanations,
      explanations_type: Array.isArray(analyses[0].explanations) ? 'array' : typeof analyses[0].explanations,
      explanations_length: Array.isArray(analyses[0].explanations) ? analyses[0].explanations.length : 'N/A'
    });

    historyList.innerHTML = analyses.map(function(analysis, index) {
      const date = new Date(analysis.created_at).toLocaleString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // 解説テキストの準備
      let explanationText = '';
      if (analysis.explanations) {
        const explanation = Array.isArray(analysis.explanations) && analysis.explanations.length > 0
          ? analysis.explanations[0]
          : analysis.explanations;

        if (explanation.summary) {
          explanationText = explanation.summary + '\n\n' + (explanation.content || '');
        } else if (explanation.content) {
          explanationText = explanation.content;
        }
      }

      return '<div class="history-item" data-index="' + index + '">' +
        '<div class="history-item-header">' +
          '<div class="history-title">' + escapeHtml(analysis.file_name || 'Untitled') + '</div>' +
          '<div class="history-meta">' +
            '<div class="history-meta-left">' +
              '<span class="badge">' + escapeHtml(analysis.language) + '</span>' +
              '<span>' + escapeHtml(date) + '</span>' +
            '</div>' +
            '<span class="toggle-arrow">▼</span>' +
          '</div>' +
        '</div>' +
        '<div class="history-item-content">' +
          '<div class="history-item-text">' + escapeHtml(explanationText || '解説がありません') + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    console.log('│ ✅ DOM updated with', analyses.length, 'items');

    historyList.onclick = function(event) {
      const item = event.target.closest('.history-item');
      if (!item) return;

      console.log('┌─ [Webview] History Item Clicked ───────');

      // トグル機能：履歴アイテム内のコンテンツを展開/折りたたみ
      const content = item.querySelector('.history-item-content');
      const arrow = item.querySelector('.toggle-arrow');

      if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        if (arrow) arrow.textContent = '▼';
        console.log('│ Collapsed history item');
      } else {
        // 他の開いている履歴アイテムを閉じる
        const allContents = historyList.querySelectorAll('.history-item-content.expanded');
        allContents.forEach(function(c) {
          c.classList.remove('expanded');
        });
        const allArrows = historyList.querySelectorAll('.toggle-arrow');
        allArrows.forEach(function(a) {
          a.textContent = '▼';
        });

        content.classList.add('expanded');
        if (arrow) arrow.textContent = '▲';
        console.log('│ Expanded history item');
      }

      console.log('└────────────────────────────────────────');
    };

    console.log('└────────────────────────────────────────');
  }

  console.log('[Webview] Script initialized successfully');
})();
    `;

    return scriptContent;
  }
}
