import * as vscode from 'vscode';
import { ApiClient } from './api/client';
import { AuthManager } from './authentication/authManager';
import { FileWatcher } from './fileWatcher/watcher';
import { showWelcomePanel } from './ui/welcomePanel';
import { LearningPanelProvider } from './ui/learningPanel';

export async function activate(context: vscode.ExtensionContext) {
  console.log('┌─────────────────────────────────────────────────────');
  console.log('│ 🚀 VIBECODING Extension Activating...');
  console.log('├─────────────────────────────────────────────────────');

  // APIクライアント初期化 
  console.log('│ [1/5] Initializing API Client...');
  const apiClient = new ApiClient(context);
  console.log('│       ✅ API Client ready');

  // 認証マネージャー初期化
  console.log('│ [2/5] Initializing Auth Manager...');
  const authManager = new AuthManager(context, apiClient);
  await authManager.initialize();
  const isAuth = await apiClient.isAuthenticated();
  console.log('│       ✅ Auth Manager ready (authenticated:', isAuth + ')');

  // ファイルウォッチャー初期化
  console.log('│ [3/5] Initializing File Watcher...');
  const fileWatcher = new FileWatcher(context, apiClient);
  fileWatcher.start();
  console.log('│       ✅ File Watcher started');

  // 初回起動時のウェルカム表示（未認証の場合のみ）
  console.log('│ [4/5] Checking first launch...');
  const isFirstLaunch = context.globalState.get('vibecoding.firstLaunch', true);
  console.log('│       First launch:', isFirstLaunch);
  console.log('│       Authenticated:', isAuth);
  if (isFirstLaunch && !isAuth) {
    console.log('│       Showing welcome panel (first time & not authenticated)');
    await showWelcomePanel(context, authManager);
    context.globalState.update('vibecoding.firstLaunch', false);
    console.log('│       ✅ Welcome panel shown');
  } else if (isFirstLaunch && isAuth) {
    console.log('│       Skipping welcome panel (already authenticated)');
    context.globalState.update('vibecoding.firstLaunch', false);
  } else {
    console.log('│       Skipping welcome panel (not first launch)');
  }

  // サイドバーパネル登録
  console.log('│ [5/5] Registering Learning Panel...');
  console.log('│       Creating LearningPanelProvider instance...');
  const learningPanelProvider = new LearningPanelProvider(context, apiClient, fileWatcher);
  console.log('│       ✅ Provider instance created:', !!learningPanelProvider);
  console.log('│       Provider constructor name:', learningPanelProvider.constructor.name);
  console.log('│       Has resolveWebviewView method:', typeof learningPanelProvider.resolveWebviewView === 'function');

  console.log('│       Calling vscode.window.registerWebviewViewProvider...');
  console.log('│       - View ID: "vibecoding.learningPanel"');
  console.log('│       - Provider object: OK');
  console.log('│       - Options: { webviewOptions: { retainContextWhenHidden: true } }');

  const provider = vscode.window.registerWebviewViewProvider('vibecoding.learningPanel', learningPanelProvider, {
    webviewOptions: {
      retainContextWhenHidden: true
    }
  });

  console.log('│       ✅ registerWebviewViewProvider returned:', !!provider);
  console.log('│       Return value type:', typeof provider);
  console.log('│       Has dispose method:', typeof provider.dispose === 'function');

  context.subscriptions.push(provider);
  console.log('│       ✅ Provider added to subscriptions');
  console.log('│       Total subscriptions:', context.subscriptions.length);
  console.log('│');
  console.log('│       🔍 IMPORTANT: resolveWebviewView should be called when you click the VIBECODING icon in the sidebar');
  console.log('│       🔍 If you don\'t see "resolveWebviewView CALLED" log after clicking, there\'s a configuration issue');
  console.log('│       ✅ Learning Panel registered');

  // 認証状態変更時にパネルを更新
  authManager.onAuthStateChanged(() => {
    console.log('│ 🔄 Auth state changed, refreshing panel...');
    learningPanelProvider.refresh();
  });

  // ログインコマンド
  const loginCommand = vscode.commands.registerCommand('vibecoding.login', async () => {
    await authManager.showLoginWebview('login');
  });

  // 新規登録コマンド
  const signupCommand = vscode.commands.registerCommand('vibecoding.signup', async () => {
    await authManager.showLoginWebview('signup');
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
      const dashboardUrl = 'https://techstars-learn.vercel.app';
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

  // 選択コードを解析 (右クリックメニュー)
  const analyzeSelectionCommand = vscode.commands.registerCommand(
    'vibecoding.analyzeSelection',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('アクティブなファイルがありません');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showWarningMessage('コードを選択してください');
        return;
      }

      const isAuth = await apiClient.isAuthenticated();
      if (!isAuth) {
        vscode.window.showWarningMessage('ログインが必要です');
        await authManager.showLoginWebview();
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'コードを解析中...',
          cancellable: false,
        },
        async () => {
          const languageId = editor.document.languageId;
          const fileName = editor.document.fileName.split('/').pop() || 'selection.txt';

          const result = await apiClient.analyzeCode({
            code: selectedText,
            language: languageId,
            fileName,
            level: 'intermediate',
          });

          if (result.success && result.data) {
            vscode.window.showInformationMessage(
              `解説を生成しました: ${result.data.summary || '解析完了'}`
            );
          } else {
            vscode.window.showErrorMessage('解析に失敗しました');
          }
        }
      );
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
    signupCommand,
    logoutCommand,
    showExplanationCommand,
    showDashboardCommand,
    analyzeFileCommand,
    analyzeSelectionCommand,
    generateTestCommand
  );

  console.log('├─────────────────────────────────────────────────────');
  console.log('│ ✅ All commands registered');
  console.log('├─────────────────────────────────────────────────────');
  console.log('│ 🎉 VIBECODING Extension Activated Successfully!');
  console.log('└─────────────────────────────────────────────────────');
}

export function deactivate() {
  console.log('VIBECODING Extension is now deactivated');
}
