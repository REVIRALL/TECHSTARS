import * as vscode from 'vscode';
import { ApiClient } from '../api/client';

export class AuthManager {
  private context: vscode.ExtensionContext;
  private apiClient: ApiClient;
  private statusBarItem: vscode.StatusBarItem;
  private onAuthStateChangedCallbacks: Array<(isLoggedIn: boolean, user?: any) => void> = [];

  constructor(context: vscode.ExtensionContext, apiClient: ApiClient) {
    this.context = context;
    this.apiClient = apiClient;

    // ステータスバー作成
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'vibecoding.login';
    context.subscriptions.push(this.statusBarItem);
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    const isAuth = await this.apiClient.isAuthenticated();
    if (isAuth) {
      await this.updateUserStatus();
    } else {
      this.updateStatusBar(false);
    }
  }

  /**
   * ログインWebview表示
   */
  async showLoginWebview(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'vibecodingLogin',
      'VIBECODING ログイン',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = this.getLoginHtml();

    // Webviewからのメッセージ受信
    panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'login':
            await this.handleLogin(message.email, message.password);
            panel.dispose();
            break;
          case 'signup':
            await this.handleSignup(message.email, message.password, message.name);
            panel.dispose();
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  /**
   * ログイン処理
   */
  private async handleLogin(email: string, password: string): Promise<void> {
    try {
      const result = await this.apiClient.login(email, password);

      if (result.success) {
        vscode.window.showInformationMessage('ログインに成功しました!');
        await this.updateUserStatus();
        this.notifyAuthStateChanged(true, result.data?.user);
      } else {
        vscode.window.showErrorMessage(`ログイン失敗: ${result.error}`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`ログインエラー: ${error}`);
    }
  }

  /**
   * サインアップ処理
   */
  private async handleSignup(email: string, password: string, name: string): Promise<void> {
    try {
      const result = await this.apiClient.signup(email, password, name);

      if (result.success) {
        vscode.window.showInformationMessage(
          'アカウント作成成功! 続けてログインしてください。'
        );
        // 自動ログイン
        await this.handleLogin(email, password);
      } else {
        vscode.window.showErrorMessage(`サインアップ失敗: ${result.error}`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`サインアップエラー: ${error}`);
    }
  }

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    await this.apiClient.logout();
    this.updateStatusBar(false);
    this.notifyAuthStateChanged(false);
    vscode.window.showInformationMessage('ログアウトしました');
  }

  /**
   * ユーザー情報更新
   */
  private async updateUserStatus(): Promise<void> {
    const result = await this.apiClient.getMe();

    if (result.success && result.data?.user) {
      this.updateStatusBar(true, result.data.user);
      this.notifyAuthStateChanged(true, result.data.user);
    } else {
      this.updateStatusBar(false);
      this.notifyAuthStateChanged(false);
    }
  }

  /**
   * ステータスバー更新
   */
  private updateStatusBar(isLoggedIn: boolean, user?: any): void {
    if (isLoggedIn && user) {
      this.statusBarItem.text = `$(person) ${user.name || user.email}`;
      this.statusBarItem.tooltip = `VIBECODING - ${user.plan} プラン\nクリックでダッシュボードを開く`;
      this.statusBarItem.command = 'vibecoding.showDashboard';
    } else {
      this.statusBarItem.text = '$(sign-in) VIBECODING';
      this.statusBarItem.tooltip = 'クリックでログイン';
      this.statusBarItem.command = 'vibecoding.login';
    }
    this.statusBarItem.show();
  }

  /**
   * 認証状態変更通知
   */
  onAuthStateChanged(callback: (isLoggedIn: boolean, user?: any) => void): void {
    this.onAuthStateChangedCallbacks.push(callback);
  }

  private notifyAuthStateChanged(isLoggedIn: boolean, user?: any): void {
    this.onAuthStateChangedCallbacks.forEach(callback => callback(isLoggedIn, user));
  }

  /**
   * ログインHTML
   */
  private getLoginHtml(): string {
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIBECODING ログイン</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 20px;
      color: var(--vscode-foreground);
    }
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
    }
    .tab-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .tab-button {
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      cursor: pointer;
      border-radius: 4px;
    }
    .tab-button.active {
      background: var(--vscode-button-hoverBackground);
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input {
      width: 100%;
      padding: 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
    }
    button[type="submit"] {
      padding: 10px 20px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      cursor: pointer;
      border-radius: 4px;
      margin-top: 10px;
    }
    button[type="submit"]:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <h1>VIBECODING</h1>

  <div class="tab-buttons">
    <button class="tab-button active" onclick="showTab('login')">ログイン</button>
    <button class="tab-button" onclick="showTab('signup')">新規登録</button>
  </div>

  <div id="login-tab" class="tab-content active">
    <form id="login-form">
      <div class="form-group">
        <label for="login-email">メールアドレス</label>
        <input type="email" id="login-email" required>
      </div>
      <div class="form-group">
        <label for="login-password">パスワード</label>
        <input type="password" id="login-password" required>
      </div>
      <button type="submit">ログイン</button>
    </form>
  </div>

  <div id="signup-tab" class="tab-content">
    <form id="signup-form">
      <div class="form-group">
        <label for="signup-name">名前</label>
        <input type="text" id="signup-name" required>
      </div>
      <div class="form-group">
        <label for="signup-email">メールアドレス</label>
        <input type="email" id="signup-email" required>
      </div>
      <div class="form-group">
        <label for="signup-password">パスワード (8文字以上)</label>
        <input type="password" id="signup-password" minlength="8" required>
      </div>
      <button type="submit">新規登録</button>
    </form>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function showTab(tab) {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

      if (tab === 'login') {
        document.querySelector('.tab-button:first-child').classList.add('active');
        document.getElementById('login-tab').classList.add('active');
      } else {
        document.querySelector('.tab-button:last-child').classList.add('active');
        document.getElementById('signup-tab').classList.add('active');
      }
    }

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      vscode.postMessage({
        command: 'login',
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      });
    });

    document.getElementById('signup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      vscode.postMessage({
        command: 'signup',
        name: document.getElementById('signup-name').value,
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value
      });
    });
  </script>
</body>
</html>
    `;
  }
}
