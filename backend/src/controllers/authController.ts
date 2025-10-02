import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

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
        email_confirm: true, // 開発環境では即座に確認済みに
        user_metadata: {
          name: name || email.split('@')[0],
        },
      });

      if (authError) {
        logger.error('Signup error:', authError);
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
        logger.error('Profile fetch error:', profileError);
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
        logger.error('Login error:', error);
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

      // last_login_at 更新
      await supabaseAdmin
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: profile?.name,
            plan: profile?.plan || 'free',
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
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        throw new AppError('Invalid refresh token', 401);
      }

      res.json({
        success: true,
        data: {
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
   * ログアウト
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // クライアント側でトークン削除するだけでOK
      // 必要に応じて Supabase の signOut を呼ぶ
      res.json({
        success: true,
        message: 'Logged out successfully',
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
        logger.error('Password reset error:', error);
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
