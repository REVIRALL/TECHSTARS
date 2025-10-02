import axios, { AxiosInstance, AxiosError } from 'axios';
import * as vscode from 'vscode';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private client: AxiosInstance;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
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
  }

  /**
   * 認証情報クリア
   */
  async clearAuth(): Promise<void> {
    await this.context.secrets.delete('accessToken');
    await this.context.secrets.delete('refreshToken');
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

      const response = await axios.post(`${API_URL}/api/auth/refresh`, {
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
      const response = await this.client.post('/api/analyze', params);
      return response.data;
    } catch (error) {
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
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/api/analyze/history', { params });
      return response.data;
    } catch (error) {
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
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        error: error.response.data?.message || error.response.data?.error || 'Request failed',
      };
    }
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }

  /**
   * 認証済みかチェック
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}
