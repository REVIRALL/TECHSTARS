import * as vscode from 'vscode';
import { AuthManager } from '../authentication/authManager';

export async function showWelcomePanel(
  context: vscode.ExtensionContext,
  authManager: AuthManager
): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    'vibecoding.welcome',
    'VIBECODINGへようこそ',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  panel.webview.html = getWelcomeHtml();

  // メッセージハンドラー
  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case 'startLearning':
          await authManager.showLoginWebview();
          panel.dispose();
          break;
        case 'openDashboard': {
          // TECHSTARS学習プラットフォームを開く
          const dashboardUrl = 'https://techstars-learn.vercel.app/login';
          vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
          break;
        }
        case 'dismiss':
          panel.dispose();
          break;
      }
    },
    undefined,
    context.subscriptions
  );
}

function getWelcomeHtml(): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIBECODINGへようこそ</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 0;
      background: linear-gradient(135deg, #0098ff 0%, #00d084 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      line-height: 1.6;
      position: relative;
      overflow: hidden;
    }
    body::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: drift 30s linear infinite;
    }
    @keyframes drift {
      0% { transform: translate(0, 0); }
      100% { transform: translate(50px, 50px); }
    }
    .container {
      position: relative;
      max-width: 650px;
      width: 100%;
      margin: 0 20px;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 48px 40px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
      animation: slideIn 0.6s ease-out;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-icon {
      width: 72px;
      height: 72px;
      background: white;
      border-radius: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
    .logo-icon::before {
      content: "V";
      font-size: 40px;
      font-weight: 800;
      background: linear-gradient(135deg, #0098ff 0%, #00d084 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      text-align: center;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .subtitle {
      text-align: center;
      font-size: 15px;
      opacity: 0.92;
      margin-bottom: 36px;
      font-weight: 500;
    }
    .features {
      margin: 0 0 36px 0;
    }
    .feature {
      display: flex;
      align-items: flex-start;
      margin: 0 0 20px 0;
      padding: 20px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      transition: all 0.3s ease;
    }
    .feature:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    .feature-icon {
      font-size: 32px;
      margin-right: 16px;
      line-height: 1;
      flex-shrink: 0;
    }
    .feature-text h3 {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .feature-text p {
      margin: 0;
      opacity: 0.88;
      font-size: 14px;
      line-height: 1.5;
    }
    .buttons {
      display: flex;
      gap: 12px;
      margin-top: 36px;
      justify-content: center;
      flex-wrap: wrap;
    }
    button {
      padding: 16px 32px;
      font-size: 15px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 700;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      letter-spacing: 0.3px;
      position: relative;
      overflow: hidden;
    }
    button::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s;
    }
    button:hover::before {
      left: 100%;
    }
    button:hover {
      transform: translateY(-2px);
    }
    button:active {
      transform: translateY(0);
    }
    .primary {
      background: white;
      color: #0098ff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }
    .primary:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }
    .secondary {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
    }
    .secondary:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.5);
    }
    .dismiss {
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      padding: 12px 24px;
      margin-top: 16px;
    }
    .dismiss:hover {
      color: white;
      background: rgba(255, 255, 255, 0.08);
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
    }
    .footer-text {
      font-size: 12px;
      opacity: 0.7;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-icon"></div>
    </div>

    <h1>VIBECODINGへようこそ</h1>
    <p class="subtitle">AI時代のエンジニア育成プラットフォーム</p>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">🤖</div>
        <div class="feature-text">
          <h3>Claude Codeを自動検出</h3>
          <p>AIが生成したコードを自動で認識し、即座に学習支援を開始します</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">📚</div>
        <div class="feature-text">
          <h3>リアルタイム解説</h3>
          <p>コードを書くたびに、自動で分かりやすい解説とヒントを生成</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">⚡</div>
        <div class="feature-text">
          <h3>ワンクリックで学習開始</h3>
          <p>複雑な設定は不要。今すぐ効率的な学習を始められます</p>
        </div>
      </div>
    </div>

    <div class="buttons">
      <button class="primary" onclick="startLearning()">
        今すぐ学習を始める
      </button>
      <button class="secondary" onclick="openDashboard()">
        ダッシュボードを開く
      </button>
    </div>

    <div style="text-align: center;">
      <button class="dismiss" onclick="dismiss()">後で表示</button>
    </div>

    <div class="footer">
      <div class="footer-text">
        © 2025 VIBECODING / TECHSTARS<br>
        AI時代のエンジニアを育成する次世代学習プラットフォーム
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function startLearning() {
      vscode.postMessage({ command: "startLearning" });
    }

    function openDashboard() {
      vscode.postMessage({ command: "openDashboard" });
    }

    function dismiss() {
      vscode.postMessage({ command: "dismiss" });
    }
  </script>
</body>
</html>`;
}
