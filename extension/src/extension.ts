import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('VIBECODING Extension is now active!');

  // ログインコマンド
  let loginCommand = vscode.commands.registerCommand('vibecoding.login', async () => {
    vscode.window.showInformationMessage('VIBECODING: ログイン機能を実装中...');
  });

  // 解説表示コマンド
  let showExplanationCommand = vscode.commands.registerCommand(
    'vibecoding.showExplanation',
    async () => {
      vscode.window.showInformationMessage('VIBECODING: 解説表示機能を実装中...');
    }
  );

  // ダッシュボード表示コマンド
  let showDashboardCommand = vscode.commands.registerCommand(
    'vibecoding.showDashboard',
    async () => {
      vscode.window.showInformationMessage('VIBECODING: ダッシュボード機能を実装中...');
    }
  );

  // ファイル解析コマンド
  let analyzeFileCommand = vscode.commands.registerCommand(
    'vibecoding.analyzeCurrentFile',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('アクティブなファイルがありません');
        return;
      }
      vscode.window.showInformationMessage(
        `VIBECODING: ${editor.document.fileName} を解析中...`
      );
    }
  );

  // ステータスバー
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = '$(sign-in) VIBECODING';
  statusBarItem.command = 'vibecoding.login';
  statusBarItem.tooltip = 'VIBECODINGにログイン';
  statusBarItem.show();

  context.subscriptions.push(
    loginCommand,
    showExplanationCommand,
    showDashboardCommand,
    analyzeFileCommand,
    statusBarItem
  );
}

export function deactivate() {
  console.log('VIBECODING Extension is now deactivated');
}
