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
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('plan')
      .eq('id', data.user.id)
      .single();

    // profileが存在しない場合は自動作成（既存ユーザー対応）
    if (profileError && profileError.code === 'PGRST116') {
      logger.info('Profile not found for user:', data.user.id, 'Creating new profile...');

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          plan: 'free',
          created_at: new Date().toISOString(),
        })
        .select('plan')
        .single();

      // UNIQUE constraint violation = 別のリクエストが先に作成済み
      if (createError && createError.code === '23505') {
        logger.warn('Profile already created by another request, fetching...');
        // 再度取得
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('plan')
          .eq('id', data.user.id)
          .single();

        profile = existingProfile;
      } else if (createError) {
        logger.error('Failed to create profile:', createError);
        throw new AppError('Failed to create user profile', 500);
      } else {
        profile = newProfile;
        logger.info('Profile created successfully for user:', data.user.id);
      }
    } else if (profileError) {
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
      let { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('plan')
        .eq('id', data.user.id)
        .single();

      // profileが存在しない場合は自動作成
      if (profileError && profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            plan: 'free',
            created_at: new Date().toISOString(),
          })
          .select('plan')
          .single();

        // UNIQUE constraint violation = 別のリクエストが先に作成済み
        if (createError && createError.code === '23505') {
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('plan')
            .eq('id', data.user.id)
            .single();

          profile = existingProfile || null;
        } else {
          profile = newProfile || null;
        }
      }

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
