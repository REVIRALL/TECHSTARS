import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

// Express Request に user プロパティを追加
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        plan: string;
      };
    }
  }
}

/**
 * JWT認証ミドルウェア
 * Authorization: Bearer <token> を検証
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7); // "Bearer " を除去

    // Supabase でトークン検証
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      logger.error('Token verification failed:', error);
      throw new AppError('Invalid or expired token', 401);
    }

    // プロフィール取得 (plan情報が必要)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('plan')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      logger.error('Profile fetch failed:', profileError);
      throw new AppError('User profile not found', 404);
    }

    // req.user にユーザー情報を格納
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      plan: profile?.plan || 'free',
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * オプショナル認証ミドルウェア
 * トークンがあれば検証、なくてもエラーにしない
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // トークンなし → req.user は undefined のまま
      return next();
    }

    const token = authHeader.substring(7);

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && data.user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('plan')
        .eq('id', data.user.id)
        .single();

      req.user = {
        id: data.user.id,
        email: data.user.email || '',
        plan: profile?.plan || 'free',
      };
    }

    next();
  } catch (error) {
    // エラーでも続行
    next();
  }
};
