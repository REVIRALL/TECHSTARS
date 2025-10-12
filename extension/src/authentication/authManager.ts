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
  async showLoginWebview(mode: 'login' | 'signup' = 'login'): Promise<void> {
    const title = mode === 'login' ? 'VIBECODING ログイン' : 'VIBECODING 新規登録';
    const panel = vscode.window.createWebviewPanel(
      'vibecodingAuth',
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = this.getAuthHtml(mode);

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
   * 認証HTML（ログインまたは新規登録）
   */
  private getAuthHtml(mode: 'login' | 'signup'): string {
    const title = mode === 'login' ? 'ログイン' : '新規登録';
    const isLogin = mode === 'login';

    return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIBECODING ${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 0;
      color: var(--vscode-foreground);
      background: linear-gradient(135deg, rgba(0, 152, 255, 0.08) 0%, rgba(0, 208, 132, 0.08) 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 450px;
      padding: 20px;
    }
    .card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 16px;
      padding: 40px 36px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }
    .header {
      text-align: center;
      margin-bottom: 36px;
    }
    .logo {
      display: inline-block;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #0098ff 0%, #00d084 100%);
      border-radius: 14px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0, 152, 255, 0.3);
    }
    .logo::before {
      content: "V";
      font-size: 32px;
      font-weight: 800;
      color: white;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #0098ff 0%, #00d084 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 13px;
      opacity: 0.6;
      font-weight: 500;
    }
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 28px;
      text-align: center;
      letter-spacing: -0.3px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.2px;
    }
    input {
      width: 100%;
      padding: 13px 16px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1.5px solid var(--vscode-input-border);
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s ease;
    }
    input:hover {
      border-color: rgba(0, 152, 255, 0.4);
    }
    input:focus {
      outline: none;
      border-color: #0098ff;
      box-shadow: 0 0 0 3px rgba(0, 152, 255, 0.1);
    }
    button[type="submit"] {
      width: 100%;
      padding: 15px 20px;
      background: linear-gradient(135deg, #0098ff 0%, #0066cc 100%);
      color: white;
      border: none;
      cursor: pointer;
      border-radius: 10px;
      margin-top: 24px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.3px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 14px rgba(0, 152, 255, 0.35);
      position: relative;
      overflow: hidden;
    }
    button[type="submit"]::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }
    button[type="submit"]:hover {
      background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 152, 255, 0.45);
    }
    button[type="submit"]:hover::before {
      left: 100%;
    }
    button[type="submit"]:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 152, 255, 0.3);
    }
    .hint {
      font-size: 12px;
      opacity: 0.55;
      margin-top: 6px;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--vscode-panel-border);
    }
    .footer-text {
      font-size: 12px;
      opacity: 0.5;
      font-weight: 500;
    }
    .footer-link {
      color: #0098ff;
      text-decoration: none;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .footer-link:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .card {
      animation: fadeInUp 0.4s ease-out;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo"></div>
        <h1>VIBECODING</h1>
        <div class="subtitle">AI時代のエンジニア育成</div>
      </div>

      <h2>${title}</h2>

      ${isLogin ? `
      <form id="auth-form">
        <div class="form-group">
          <label for="email">メールアドレス</label>
          <input type="email" id="email" placeholder="example@email.com" required autofocus>
        </div>
        <div class="form-group">
          <label for="password">パスワード</label>
          <input type="password" id="password" placeholder="パスワードを入力" required>
        </div>
        <button type="submit">ログイン</button>
      </form>
      ` : `
      <form id="auth-form">
        <div class="form-group">
          <label for="name">名前</label>
          <input type="text" id="name" placeholder="山田 太郎" required autofocus>
        </div>
        <div class="form-group">
          <label for="email">メールアドレス</label>
          <input type="email" id="email" placeholder="example@email.com" required>
        </div>
        <div class="form-group">
          <label for="password">パスワード</label>
          <input type="password" id="password" placeholder="8文字以上" minlength="8" required>
          <div class="hint">8文字以上の英数字を組み合わせてください</div>
        </div>
        <button type="submit">新規登録</button>
      </form>
      `}

      <div class="footer">
        <div class="footer-text">
          登録することで、
          <a href="https://techstars-learn.vercel.app/terms" class="footer-link" target="_blank">利用規約</a>と
          <a href="https://techstars-learn.vercel.app/privacy" class="footer-link" target="_blank">プライバシーポリシー</a>に同意したものとみなされます
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const isLogin = ${isLogin};

    document.getElementById('auth-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const button = e.target.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = '処理中...';

      if (isLogin) {
        vscode.postMessage({
          command: 'login',
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        });
      } else {
        vscode.postMessage({
          command: 'signup',
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        });
      }
    });
  </script>
</body>
</html>
    `;
  }
}
