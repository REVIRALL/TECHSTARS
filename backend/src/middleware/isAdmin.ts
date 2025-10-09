import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * 管理者権限チェックミドルウェア
 *
 * セキュリティ要件:
 * - authenticate middleware の後に実行すること
 * - req.user が存在することを前提とする
 * - is_admin = true のユーザーのみ許可
 *
 * @security CRITICAL - 管理者APIの保護に必須
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      logger.warn('isAdmin middleware: No user ID found in request');
      throw new AppError('Authentication required', 401);
    }

    // プロフィールから is_admin フラグを取得
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('isAdmin middleware: Failed to fetch profile:', error);
      throw new AppError('Failed to verify admin status', 500);
    }

    // プロフィールが存在しない場合（理論上は authenticate で作成されるはず）
    if (!profile) {
      logger.error('isAdmin middleware: Profile not found for authenticated user:', userId);
      throw new AppError('User profile not found', 500);
    }

    // 管理者フラグチェック
    if (profile.is_admin !== true) {
      logger.warn(`isAdmin middleware: User ${userId} attempted to access admin API without permission`);
      throw new AppError('Admin access required. This incident will be logged.', 403);
    }

    logger.info(`isAdmin middleware: Admin ${userId} authorized for ${req.method} ${req.path}`);
    next();
  } catch (error) {
    next(error);
  }
};
