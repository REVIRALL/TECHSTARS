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
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent();

    // メッセージハンドラー
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
          await this.openSignup();
          break;
        case 'login':
          vscode.commands.executeCommand('vibecoding.login');
          break;
        case 'logout':
          vscode.commands.executeCommand('vibecoding.logout');
          break;
      }
    });

    // 初期データロード
    this.refresh();
  }

  private async analyzeSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('アクティブなファイルがありません');
      return;
    }

    // 認証チェック
    const isAuth = await this.apiClient.isAuthenticated();
    if (!isAuth) {
      vscode.window.showWarningMessage('ログインが必要です');
      vscode.commands.executeCommand('vibecoding.login');
      return;
    }

    const selection = editor.selection;
    let codeToAnalyze = editor.document.getText(selection);

    // 選択がない、または空の場合はファイル全体を解析
    if (!codeToAnalyze || codeToAnalyze.trim() === '') {
      codeToAnalyze = editor.document.getText();
      if (!codeToAnalyze || codeToAnalyze.trim() === '') {
        vscode.window.showWarningMessage('ファイルが空です');
        return;
      }
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'コードを解析中...',
        cancellable: false,
      },
      async () => {
        const languageId = editor.document.languageId;
        const fileName = editor.document.fileName.split('/').pop() || editor.document.fileName.split('\\').pop() || 'file.txt';

        const result = await this.apiClient.analyzeCode({
          code: codeToAnalyze,
          language: languageId,
          fileName,
          level: 'intermediate',
        });

        if (result.success && result.data) {
          this.view?.webview.postMessage({
            command: 'showExplanation',
            data: result.data,
          });
          vscode.window.showInformationMessage('解説を生成しました');
        } else {
          const errorMsg = result.error || result.message || '不明なエラーが発生しました';
          console.error('Analysis failed:', errorMsg, result);
          vscode.window.showErrorMessage(`解析に失敗しました: ${errorMsg}`);
        }
      }
    );
  }

  private async showHistory() {
    try {
      console.log('Fetching analysis history...');
      const result = await this.apiClient.getAnalysisHistory({ limit: 10 });
      console.log('History API result:', result);

      if (result.success && result.data?.analyses) {
        console.log('Sending history to webview:', result.data.analyses.length, 'items');
        this.view?.webview.postMessage({
          command: 'updateHistory',
          data: result.data.analyses,
        });
      } else {
        console.error('Failed to fetch history:', result);
        this.view?.webview.postMessage({
          command: 'updateHistory',
          data: [],
        });
      }
    } catch (error) {
      console.error('Error fetching history:', error);
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
            message: `${completed + 1}/${recentChanges.length}: ${change.fileName}`,
          });

          try {
            const document = await vscode.workspace.openTextDocument(change.filePath);
            const code = document.getText();

            const config = vscode.workspace.getConfiguration('vibecoding');
            const level = config.get<'beginner' | 'intermediate' | 'advanced'>(
              'explanationLevel',
              'intermediate'
            );

            await this.apiClient.analyzeCode({
              code,
              language: change.languageId,
              fileName: change.fileName,
              level,
            });

            completed++;
          } catch (error) {
            console.error(`Failed to analyze ${change.fileName}:`, error);
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

  private async openSignup() {
    const signupUrl = 'http://localhost:3002/';
    vscode.env.openExternal(vscode.Uri.parse(signupUrl));
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
        async () => {
          const result = await this.apiClient.analyzeCode({
            code,
            language: document.languageId,
            fileName: filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown',
            level,
          });

          if (result.success && result.data) {
            this.view?.webview.postMessage({
              command: 'showExplanation',
              data: result.data,
            });
            vscode.window.showInformationMessage('解説を生成しました');
          } else {
            vscode.window.showErrorMessage('解析に失敗しました');
          }
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(`エラー: ${error}`);
    }
  }

  public async refresh() {
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
  }

  private getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIBECODING</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
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
      content: '';
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
    }
    .history-item,
    .file-item {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 10px;
      padding: 14px;
      margin: 8px 0;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .history-item::before,
    .file-item::before {
      content: '';
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
  </style>
</head>
<body>
  <div id="content" class="container">
    <!-- 未ログイン時 -->
    <div id="not-logged-in" style="display: none;">
      <div class="not-logged-in">
        <div class="brand-header">
          <div class="brand-title">VIBECODING</div>
        </div>
        <p class="welcome-text">ログインまたは新規登録して<br>学習を始めましょう</p>
        <button class="action-button primary-action" onclick="login()">ログイン</button>
        <button class="action-button secondary-button" onclick="signup()">新規登録</button>
      </div>
    </div>

    <!-- ログイン後 -->
    <div id="logged-in" style="display: none;">
      <div class="section">
        <h3>クイックアクション</h3>
        <button class="action-button primary-action" onclick="analyzeSelection()">選択コードを解析</button>
        <button class="action-button success-action" id="analyze-recent-btn" onclick="analyzeRecentChanges()">
          最近の変更を解析<span class="count-badge" id="recent-count">0</span>
        </button>
        <button class="action-button secondary-button" onclick="refresh()">更新</button>
      </div>

      <div class="divider"></div>

      <div class="section">
        <h3>監視フォルダ</h3>
        <button class="action-button secondary-button" onclick="addWatchFolder()">+ フォルダを追加</button>
        <div id="watch-folders-list" style="margin-top: 10px;"></div>
      </div>

      <div class="divider"></div>

      <div class="section" id="recent-changes-section" style="display: none;">
        <h3>最近の変更</h3>
        <div id="recent-changes-list"></div>
      </div>

      <div class="section" id="explanation-section" style="display: none;">
        <h3>解説</h3>
        <div id="explanation-content" class="explanation-box"></div>
      </div>

      <div class="section">
        <h3>最近の解析</h3>
        <div id="history-list"></div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <button class="action-button secondary-button" onclick="logout()">ログアウト</button>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let isAuthenticated = false;
    let recentChanges = [];
    let watchFolders = [];

    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.command) {
        case 'updateAuth':
          isAuthenticated = message.isAuthenticated;
          updateAuthUI();
          break;
        case 'updateRecentChanges':
          recentChanges = message.recentChanges || [];
          updateRecentChanges();
          break;
        case 'updateWatchFolders':
          watchFolders = message.watchFolders || [];
          updateWatchFolders();
          break;
        case 'showExplanation':
          showExplanation(message.data);
          break;
        case 'updateHistory':
          updateHistory(message.data);
          break;
      }
    });

    function updateAuthUI() {
      document.getElementById('not-logged-in').style.display = isAuthenticated ? 'none' : 'block';
      document.getElementById('logged-in').style.display = isAuthenticated ? 'block' : 'none';
    }

    function analyzeSelection() {
      vscode.postMessage({ command: 'analyzeSelection' });
    }

    function refresh() {
      vscode.postMessage({ command: 'refresh' });
    }

    function analyzeRecentChanges() {
      vscode.postMessage({ command: 'analyzeRecentChanges' });
    }

    function signup() {
      vscode.postMessage({ command: 'signup' });
    }

    function login() {
      vscode.postMessage({ command: 'login' });
    }

    function logout() {
      vscode.postMessage({ command: 'logout' });
    }

    function addWatchFolder() {
      console.log('addWatchFolder clicked');
      vscode.postMessage({ command: 'addWatchFolder' });
    }

    function removeWatchFolder(path) {
      vscode.postMessage({ command: 'removeWatchFolder', path });
    }

    function updateWatchFolders() {
      const listEl = document.getElementById('watch-folders-list');

      if (watchFolders.length === 0) {
        listEl.innerHTML = '<div class="empty-message">監視フォルダが設定されていません</div>';
        return;
      }

      listEl.innerHTML = watchFolders.map((folder, index) =>
        '<div class="folder-item">' +
          '<span class="folder-path" title="' + folder + '">' + folder + '</span>' +
          '<button class="remove-btn" data-index="' + index + '">削除</button>' +
        '</div>'
      ).join('');

      // イベントリスナーを追加
      const removeButtons = listEl.querySelectorAll('.remove-btn');
      removeButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
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

      listEl.innerHTML = recentChanges.map((change, index) => {
        const date = new Date(change.timestamp).toLocaleTimeString('ja-JP');
        return '<div class="file-item" data-index="' + index + '">' +
          '<div class="file-name">' + change.fileName + '</div>' +
          '<div class="file-meta">' +
            '<span class="badge">' + change.languageId + '</span>' +
            '<span>' + date + '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      console.log('[updateRecentChanges] Added', recentChanges.length, 'file items to DOM');

      // イベント委譲で一度だけリスナー追加
      listEl.onclick = (event) => {
        const item = event.target.closest('.file-item');
        if (!item) return;

        const index = parseInt(item.getAttribute('data-index'));
        console.log('[updateRecentChanges] Clicked file item', index, recentChanges[index]?.filePath);

        vscode.postMessage({
          command: 'analyzeFile',
          filePath: recentChanges[index].filePath
        });
      };
    }

    function showExplanation(data) {
      const section = document.getElementById('explanation-section');
      const content = document.getElementById('explanation-content');

      const explanation = data.explanation || data;

      let text = '';
      if (explanation.summary) {
        text = explanation.summary + '\n\n' + (explanation.content || '');
      } else {
        text = explanation.content || '解説を生成しました';
      }

      // 改行を<br>に変換して表示（簡易的なMarkdown対応）
      content.innerHTML = text.replace(/\n/g, '<br>');

      section.style.display = 'block';
    }

    function updateHistory(analyses) {
      console.log('[updateHistory] Called with', analyses?.length || 0, 'items');
      const historyList = document.getElementById('history-list');

      if (!analyses || analyses.length === 0) {
        historyList.innerHTML = '<div class="empty-message">履歴がありません</div>';
        return;
      }

      historyList.innerHTML = analyses.map((analysis, index) => {
        const date = new Date(analysis.created_at).toLocaleString('ja-JP', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        return '<div class="history-item" data-index="' + index + '">' +
          '<div class="history-title">' + (analysis.file_name || 'Untitled') + '</div>' +
          '<div class="history-meta">' +
            '<span class="badge">' + analysis.language + '</span>' +
            '<span>' + date + '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      console.log('[updateHistory] Added', analyses.length, 'history items to DOM');

      // イベント委譲で一度だけリスナー追加
      historyList.onclick = (event) => {
        const item = event.target.closest('.history-item');
        if (!item) return;

        const index = parseInt(item.getAttribute('data-index'));
        console.log('[updateHistory] Clicked history item', index);

        const analysis = analyses[index];
        let explanation = analysis.explanations;
        if (Array.isArray(explanation) && explanation.length > 0) {
          explanation = explanation[0];
        }
        showExplanation({
          explanation: explanation || analysis
        });
      };
    }
  </script>
</body>
</html>`;
  }
}
