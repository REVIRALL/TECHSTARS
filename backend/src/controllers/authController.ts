import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { logger, sanitizeError } from '../utils/logger';

export const authController = {
  /**
   * ユーザー登録
   */
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      // バリデーション
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }

      // Supabase Auth でユーザー作成
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        // セキュリティ: 本番環境ではメール確認必須（スパムアカウント防止）
        email_confirm: process.env.NODE_ENV === 'development',
        user_metadata: {
          name: name || email.split('@')[0],
        },
      });

      if (authError) {
        logger.error('Signup error:', sanitizeError(authError));
        throw new AppError(authError.message, 400);
      }

      if (!authData.user) {
        throw new AppError('User creation failed', 500);
      }

      // Profiles テーブルは trigger で自動作成される
      // プロフィール取得
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        logger.error('Profile fetch error:', sanitizeError(profileError));
      }

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name: profile?.name || name,
            plan: profile?.plan || 'free',
          },
        },
        message: 'User registered successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * ログイン
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      // Supabase Auth でログイン
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // セキュリティログ: 不正なログイン試行
        logger.warn('Failed login attempt', {
          email,
          error: sanitizeError(error),
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
        throw new AppError('Invalid credentials', 401);
      }

      if (!data.user || !data.session) {
        throw new AppError('Login failed', 401);
      }

      // プロフィール取得
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // 承認ステータスチェック
      if (profile?.approval_status === 'rejected') {
        logger.warn('Rejected user login attempt', {
          userId: data.user.id,
          email: data.user.email,
          ip: req.ip,
        });
        throw new AppError('Your account has been rejected. Please contact support.', 403);
      }

      if (profile?.approval_status === 'pending') {
        // 承認待ちでもログインは許可するが、フラグを返す
        logger.info(`User logged in (pending approval): ${email}`);
      } else {
        // last_login_at 更新（承認済みユーザーのみ）
        await supabaseAdmin
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id);

        logger.info(`User logged in: ${email}`);
      }

      res.json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: profile?.name,
            plan: profile?.plan || 'free',
            approvalStatus: profile?.approval_status || 'pending',
            // isAdmin は除去（セキュリティ対策: 管理者アカウント特定の防止）
            // 必要に応じて /api/auth/me で取得可能
          },
          session: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            expiresAt: data.session.expires_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * トークンリフレッシュ
   *
   * セキュリティ: Refresh Token Rotation
   * - Supabase は自動的に新しい refresh_token を発行
   * - クライアントは必ず新しい refresh_token を保存・使用すること
   * - 古い refresh_token の再利用はセキュリティリスク
   *
   * TODO Phase 2: 使用済みトークンのブラックリスト実装
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      // Supabase の refreshSession は自動的にトークンローテーションを実行
      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        logger.warn('Refresh token validation failed', { error: error?.message });
        throw new AppError('Invalid or expired refresh token', 401);
      }

      logger.info(`Token refreshed for user: ${data.user?.id}`);

      res.json({
        success: true,
        data: {
          session: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token, // ← 必ず新しいトークンを使用
            expiresIn: data.session.expires_in,
            expiresAt: data.session.expires_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * ログアウト
   *
   * セキュリティノート:
   * - JWT はステートレスなため、サーバー側での完全な無効化には
   *   トークンブラックリスト（Redis等）の実装が必要
   * - 現在はユーザー特定とログ記録のみ実施
   * - クライアント側でトークンを削除することで実質的なログアウトを実現
   *
   * TODO: トークンブラックリストの実装（Phase 2）
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      // トークンからユーザー特定（ログ記録用）
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (!error && data.user) {
          logger.info(`User logged out: ${data.user.email} (ID: ${data.user.id})`);

          // TODO Phase 2: トークンをブラックリストに追加
          // await redisClient.setex(`blacklist:${token}`, expiresIn, '1');
        }
      }

      res.json({
        success: true,
        message: 'Logged out successfully. Please remove the token from client storage.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 現在のユーザー情報取得
   */
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401);
      }

      const token = authHeader.substring(7);

      // トークン検証
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data.user) {
        throw new AppError('Invalid token', 401);
      }

      // プロフィール取得
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      res.json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: profile?.name,
            plan: profile?.plan || 'free',
            avatarUrl: profile?.avatar_url,
            onboardingCompleted: profile?.onboarding_completed || false,
            isAdmin: profile?.is_admin || false,
            approvalStatus: profile?.approval_status || 'pending',
            createdAt: profile?.created_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * パスワードリセットメール送信
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });

      if (error) {
        logger.error('Password reset error:', sanitizeError(error));
        // セキュリティのため、エラーでも成功レスポンス
      }

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * パスワードリセット
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw new AppError('Token and new password are required', 400);
      }

      if (newPassword.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }

      // トークンからユーザー取得
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

      if (userError || !userData.user) {
        throw new AppError('Invalid or expired token', 400);
      }

      // パスワード更新
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userData.user.id,
        { password: newPassword }
      );

      if (updateError) {
        throw new AppError('Password update failed', 500);
      }

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
