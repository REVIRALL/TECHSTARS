import * as vscode from 'vscode';
import { ApiClient } from './api/client';
import { AuthManager } from './authentication/authManager';
import { FileWatcher } from './fileWatcher/watcher';

export async function activate(context: vscode.ExtensionContext) {
  console.log('VIBECODING Extension is now active!');

  // APIクライアント初期化
  const apiClient = new ApiClient(context);

  // 認証マネージャー初期化
  const authManager = new AuthManager(context, apiClient);
  await authManager.initialize();

  // ファイルウォッチャー初期化
  const fileWatcher = new FileWatcher(context, apiClient);
  fileWatcher.start();

  // ログインコマンド
  const loginCommand = vscode.commands.registerCommand('vibecoding.login', async () => {
    await authManager.showLoginWebview();
  });

  // ログアウトコマンド
  const logoutCommand = vscode.commands.registerCommand('vibecoding.logout', async () => {
    await authManager.logout();
  });

  // 解説表示コマンド (履歴から)
  const showExplanationCommand = vscode.commands.registerCommand(
    'vibecoding.showExplanation',
    async () => {
      const result = await apiClient.getAnalysisHistory({ limit: 1 });
      if (result.success && result.data?.analyses?.length > 0) {
        vscode.window.showInformationMessage('最新の解説を表示します');
        // TODO: Webview表示
      } else {
        vscode.window.showInformationMessage('解析履歴がありません');
      }
    }
  );

  // ダッシュボード表示コマンド
  const showDashboardCommand = vscode.commands.registerCommand(
    'vibecoding.showDashboard',
    async () => {
      const isAuth = await apiClient.isAuthenticated();
      if (!isAuth) {
        vscode.window.showWarningMessage('ログインが必要です');
        await authManager.showLoginWebview();
        return;
      }

      // Webダッシュボードを開く
      const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      vscode.env.openExternal(vscode.Uri.parse(`${dashboardUrl}/dashboard`));
    }
  );

  // 現在のファイルを解析コマンド
  const analyzeFileCommand = vscode.commands.registerCommand(
    'vibecoding.analyzeCurrentFile',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('アクティブなファイルがありません');
        return;
      }

      const isAuth = await apiClient.isAuthenticated();
      if (!isAuth) {
        vscode.window.showWarningMessage('ログインが必要です');
        await authManager.showLoginWebview();
        return;
      }

      await fileWatcher.analyzeFile(editor.document);
    }
  );

  // テスト生成コマンド (将来実装)
  const generateTestCommand = vscode.commands.registerCommand(
    'vibecoding.generateTest',
    async () => {
      vscode.window.showInformationMessage('テスト生成機能は近日実装予定です');
    }
  );

  context.subscriptions.push(
    loginCommand,
    logoutCommand,
    showExplanationCommand,
    showDashboardCommand,
    analyzeFileCommand,
    generateTestCommand
  );

  console.log('VIBECODING Extension activated successfully!');
}

export function deactivate() {
  console.log('VIBECODING Extension is now deactivated');
}
