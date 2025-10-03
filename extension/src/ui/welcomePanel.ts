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
        case 'openDashboard':
          const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
          vscode.env.openExternal(vscode.Uri.parse(`${dashboardUrl}/login`));
          break;
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
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      font-size: 1.2em;
      opacity: 0.9;
      margin-bottom: 30px;
    }
    .features {
      margin: 30px 0;
    }
    .feature {
      display: flex;
      align-items: center;
      margin: 20px 0;
      padding: 15px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    .feature-icon {
      font-size: 2em;
      margin-right: 15px;
    }
    .feature-text h3 {
      margin: 0 0 5px 0;
      font-size: 1.2em;
    }
    .feature-text p {
      margin: 0;
      opacity: 0.8;
      font-size: 0.9em;
    }
    .buttons {
      display: flex;
      gap: 15px;
      margin-top: 40px;
      justify-content: center;
    }
    button {
      padding: 15px 30px;
      font-size: 1.1em;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    .primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
    .dismiss {
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9em;
      padding: 10px 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>VIBECODINGへようこそ</h1>
    <p class="subtitle">AI時代のエンジニア育成プラットフォーム</p>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">[AI]</div>
        <div class="feature-text">
          <h3>Claude Codeを自動検出</h3>
          <p>AIが生成したコードを自動で認識し、理解をサポート</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">[解説]</div>
        <div class="feature-text">
          <h3>リアルタイム解説</h3>
          <p>コードを書くたびに、自動で分かりやすい解説を生成</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">[学習]</div>
        <div class="feature-text">
          <h3>ワンクリックで学習開始</h3>
          <p>複雑な設定は不要。すぐに学習を始められます</p>
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

    <div style="text-align: center; margin-top: 20px;">
      <button class="dismiss" onclick="dismiss()">後で表示</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function startLearning() {
      vscode.postMessage({ command: 'startLearning' });
    }

    function openDashboard() {
      vscode.postMessage({ command: 'openDashboard' });
    }

    function dismiss() {
      vscode.postMessage({ command: 'dismiss' });
    }
  </script>
</body>
</html>`;
}
