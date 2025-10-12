import axios, { AxiosInstance, AxiosError } from 'axios';
import * as vscode from 'vscode';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private client: AxiosInstance;
  private context: vscode.ExtensionContext;
  private authCache: boolean | null = null;
  private authCacheExpiry: number = 0;
  private readonly AUTH_CACHE_DURATION = 30 * 1000; // 30秒

  // タイムアウト制限の定義
  // Render無料プラン: 30秒（サーバー側制限）
  // Render有料プラン: 300秒（5分）
  // クライアント側: 600秒（10分）- 長いコード解析に対応
  private readonly DEFAULT_TIMEOUT = 600000; // 10分（600秒）

  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    // VSCode設定からAPI URLとタイムアウトを取得
    const config = vscode.workspace.getConfiguration('vibecoding');
    const apiUrl = config.get<string>('apiUrl', 'https://techstars.onrender.com');
    const timeout = config.get<number>('requestTimeout', this.DEFAULT_TIMEOUT);

    console.log('API URL:', apiUrl);
    console.log('Request Timeout:', timeout, 'ms (', (timeout / 1000), 'seconds)');

    this.client = axios.create({
      baseURL: apiUrl,
      timeout: timeout, // VSCode設定から取得、デフォルト10分
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // リクエストインターセプター (トークン付与)
    this.client.interceptors.request.use(
      async config => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // レスポンスインターセプター (エラーハンドリング)
    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // トークン無効 → リフレッシュ試行
          const refreshed = await this.refreshToken();
          if (refreshed && error.config) {
            // リトライ
            return this.client.request(error.config);
          } else {
            // リフレッシュ失敗 → ログアウト
            await this.clearAuth();
            vscode.window.showErrorMessage('セッションが期限切れです。再ログインしてください。');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * アクセストークン取得
   */
  private async getAccessToken(): Promise<string | undefined> {
    return await this.context.secrets.get('accessToken');
  }

  /**
   * リフレッシュトークン取得
   */
  private async getRefreshToken(): Promise<string | undefined> {
    return await this.context.secrets.get('refreshToken');
  }

  /**
   * トークン保存
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.context.secrets.store('accessToken', accessToken);
    await this.context.secrets.store('refreshToken', refreshToken);
    // トークンが保存されたので認証済みとしてキャッシュ
    this.authCache = true;
    this.authCacheExpiry = Date.now() + this.AUTH_CACHE_DURATION;
  }

  /**
   * 認証情報クリア
   */
  async clearAuth(): Promise<void> {
    await this.context.secrets.delete('accessToken');
    await this.context.secrets.delete('refreshToken');
    this.clearAuthCache(); // キャッシュもクリア
  }

  /**
   * トークンリフレッシュ
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      // this.clientを使うことでbaseURLが自動的に適用される
      const response = await this.client.post('/api/auth/refresh', {
        refreshToken,
      });

      if (response.data.success && response.data.data.session) {
        await this.saveTokens(
          response.data.data.session.accessToken,
          response.data.data.session.refreshToken
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * ログイン
   */
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/auth/login', { email, password });

      if (response.data.success && response.data.data.session) {
        await this.saveTokens(
          response.data.data.session.accessToken,
          response.data.data.session.refreshToken
        );
      }

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * サインアップ
   */
  async signup(email: string, password: string, name: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/auth/signup', { email, password, name });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearAuth();
    }
  }

  /**
   * 現在のユーザー情報取得
   */
  async getMe(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/api/auth/me');
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * コード解析
   */
  async analyzeCode(params: {
    code: string;
    language: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    fileName?: string;
    filePath?: string;
    isClaudeGenerated?: boolean;
    detectionMethod?: string;
  }): Promise<ApiResponse<any>> {
    try {
      console.log('┌─ [API] Analyzing Code ─────────────────');
      console.log('│ Language:', params.language);
      console.log('│ File:', params.fileName || 'N/A');
      console.log('│ Level:', params.level || 'intermediate');
      console.log('│ Code length:', params.code.length, 'chars');
      console.log('│ Code preview:', params.code.substring(0, 100).replace(/\n/g, '↵'));
      console.log('└────────────────────────────────────────');

      const response = await this.client.post('/api/analyze', params);

      console.log('┌─ [API] Analysis Response ──────────────');
      console.log('│ Success:', response.data.success);
      console.log('│ Status:', response.status);
      if (response.data.data) {
        console.log('│ Explanation exists:', !!response.data.data.explanation);
        const summary = response.data.data.explanation?.summary;
        console.log('│ Summary:', summary ? summary.substring(0, 100) : 'N/A');
        console.log('│ Cached:', response.data.data.cached || false);
      }
      if (response.data.error) {
        console.log('│ ❌ Error:', response.data.error);
      }
      const fullResponse = JSON.stringify(response.data, null, 2);
      console.log('│ Full response:', fullResponse ? fullResponse.substring(0, 500) : 'N/A');
      console.log('└────────────────────────────────────────');

      return response.data;
    } catch (error) {
      console.error('┌─ [API] ❌ Analysis Error ──────────────');
      console.error('│', error);
      if (axios.isAxiosError(error)) {
        console.error('│ Status:', error.response?.status);
        if (error.response?.data) {
          const errorResponse = JSON.stringify(error.response.data, null, 2);
          console.error('│ Response:', errorResponse ? errorResponse.substring(0, 300) : 'N/A');
        } else {
          console.error('│ Response: No response data');
        }
      }
      console.error('└────────────────────────────────────────');
      return this.handleError(error);
    }
  }

  /**
   * 解析履歴取得
   */
  async getAnalysisHistory(params?: {
    page?: number;
    limit?: number;
    language?: string;
    isClaudeGenerated?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    try {
      console.log('┌─ [API] Fetching History ───────────────');
      console.log('│ Params:', JSON.stringify(params || {}, null, 2));

      const response = await this.client.get('/api/analyze/history', { params });

      console.log('│ Success:', response.data.success);
      console.log('│ Status:', response.status);
      if (response.data.data) {
        console.log('│ Total items:', response.data.data.total || 'N/A');
        console.log('│ Analyses count:', response.data.data.analyses?.length || 0);
        if (response.data.data.analyses?.length > 0) {
          console.log('│ First item:', JSON.stringify({
            id: response.data.data.analyses[0].id,
            file_name: response.data.data.analyses[0].file_name,
            language: response.data.data.analyses[0].language,
            created_at: response.data.data.analyses[0].created_at
          }, null, 2));
        }
      }
      console.log('└────────────────────────────────────────');

      return response.data;
    } catch (error) {
      console.error('┌─ [API] ❌ History Error ───────────────');
      console.error('│', error);
      if (axios.isAxiosError(error)) {
        console.error('│ Status:', error.response?.status);
        if (error.response?.data) {
          const errorResponse = JSON.stringify(error.response.data, null, 2);
          console.error('│ Response:', errorResponse ? errorResponse.substring(0, 300) : 'N/A');
        } else {
          console.error('│ Response: No response data');
        }
      }
      console.error('└────────────────────────────────────────');
      return this.handleError(error);
    }
  }

  /**
   * 解析結果取得
   */
  async getAnalysisById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get(`/api/analyze/${id}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 解析結果削除
   */
  async deleteAnalysis(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.delete(`/api/analyze/${id}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * エラーハンドリング
   */
  private handleError(error: any): ApiResponse<any> {
    if (axios.isAxiosError(error)) {
      // タイムアウトエラーの明示的な処理
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error('Request timeout:', error.message);

        // タイムアウト時間を確認してRender制限を示唆
        const config = vscode.workspace.getConfiguration('vibecoding');
        const timeout = config.get<number>('requestTimeout', this.DEFAULT_TIMEOUT);

        let errorMsg = 'リクエストがタイムアウトしました。';

        // 30秒前後でタイムアウトした場合、Render無料プランの制限の可能性が高い
        if (timeout >= 30000 && timeout <= 40000) {
          errorMsg += '\n\n【原因の可能性】\n' +
            '1. Render無料プランの30秒制限（サーバー側）\n' +
            '2. サーバーがスリープから復帰中（初回リクエスト時）\n' +
            '3. コードが非常に長く、AI処理に時間がかかっている\n\n' +
            '【対処法】\n' +
            '- もう一度実行（2回目以降は速い）\n' +
            '- コードを分割して解析\n' +
            '- サーバーを有料プランにアップグレード（5分まで対応）';
        } else if (timeout > 40000) {
          errorMsg += '\n\n【原因の可能性】\n' +
            '1. サーバーがスリープから復帰中（初回リクエスト時）\n' +
            '2. コードが非常に長く、AI処理に時間がかかっている\n' +
            '3. ネットワークの問題\n\n' +
            '【対処法】\n' +
            '- もう一度実行してみる\n' +
            '- コードを分割して解析\n' +
            '- タイムアウト設定を確認（現在: ' + (timeout / 1000) + '秒）';
        }

        return {
          success: false,
          error: errorMsg,
        };
      }

      if (error.response) {
        // サーバーからのエラーレスポンス
        let errorMsg = error.response.data?.message || error.response.data?.error || `サーバーエラー (${error.response.status})`;

        // 502/504エラーの場合、Renderのタイムアウトの可能性
        if (error.response.status === 502 || error.response.status === 504) {
          errorMsg += '\n\n【注意】Render無料プランは30秒でタイムアウトします。' +
            '長いコードを解析する場合は、サーバーを有料プランにアップグレードしてください。';
        }

        console.error('API Error Response:', error.response.status, error.response.data);
        return {
          success: false,
          error: errorMsg,
        };
      } else if (error.request) {
        // リクエストは送信されたがレスポンスなし
        console.error('No response received:', error.request);
        return {
          success: false,
          error: 'サーバーに接続できません。\n\n' +
            '【確認事項】\n' +
            '1. バックエンドが起動しているか\n' +
            '2. ネットワーク接続が正常か\n' +
            '3. API URLが正しいか（設定: vibecoding.apiUrl）',
        };
      }
    }
    console.error('Unknown error:', error);
    return {
      success: false,
      error: error?.message || '不明なエラーが発生しました',
    };
  }

  /**
   * 認証済みかチェック（キャッシュ付き）
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const now = Date.now();

      // キャッシュが有効ならそれを返す（I/Oなし）
      if (this.authCache !== null && now < this.authCacheExpiry) {
        return this.authCache;
      }

      // キャッシュ期限切れ → トークンチェック
      const token = await this.getAccessToken();
      this.authCache = !!token;
      this.authCacheExpiry = now + this.AUTH_CACHE_DURATION;

      return this.authCache;
    } catch (error) {
      console.error('Error checking authentication:', error);
      // エラー時は未認証として扱う
      this.authCache = false;
      this.authCacheExpiry = 0;
      return false;
    }
  }

  /**
   * 認証キャッシュをクリア（ログイン・ログアウト時に呼ぶ）
   */
  clearAuthCache(): void {
    this.authCache = null;
    this.authCacheExpiry = 0;
  }
}
