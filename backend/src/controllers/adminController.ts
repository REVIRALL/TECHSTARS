import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// セキュリティ: ページネーション上限（DoS攻撃対策）
const MAX_PAGE_LIMIT = 100;

export const adminController = {
  /**
   * 全ユーザー一覧取得（管理者専用）
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // 管理者チェックは isAdmin middleware で実施済み

      // 承認ステータスでフィルタリング（オプション）
      const { status, limit = 50, offset = 0 } = req.query;

      // ページネーション上限チェック（DoS攻撃対策）
      const limitNum = Math.min(Number(limit), MAX_PAGE_LIMIT);
      const offsetNum = Math.max(Number(offset), 0);

      let query = supabaseAdmin
        .from('profiles')
        .select(`
          id,
          name,
          email:id(email),
          plan,
          approval_status,
          approval_notes,
          approved_at,
          approved_by,
          created_at,
          last_login_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);

      if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
        query = query.eq('approval_status', status as string);
      }

      const { data: profiles, error, count } = await query;

      if (error) {
        logger.error('Failed to fetch users:', error);
        throw new AppError('Failed to fetch users', 500);
      }

      // auth.users からメールアドレスを取得
      const profilesWithEmail = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          return {
            ...profile,
            email: authUser.user?.email,
          };
        })
      );

      logger.info(`Admin ${userId} fetched ${profiles?.length || 0} users`);

      res.json({
        success: true,
        data: {
          users: profilesWithEmail,
          total: count,
          limit: limitNum,
          offset: offsetNum,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * ユーザー承認
   */
  async approveUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: targetUserId } = req.params;
      const { notes } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        throw new AppError('Unauthorized', 401);
      }

      // 管理者チェックは isAdmin middleware で実施済み

      // ユーザー承認
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          approval_status: 'approved',
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          approved_by: adminId,
        })
        .eq('id', targetUserId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to approve user:', error);
        throw new AppError('Failed to approve user', 500);
      }

      // メールアドレス取得
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

      logger.info(`Admin ${adminId} approved user ${targetUserId} (${authUser.user?.email})`);

      res.json({
        success: true,
        data: {
          user: {
            ...data,
            email: authUser.user?.email,
          },
        },
        message: 'User approved successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * ユーザー拒否
   */
  async rejectUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: targetUserId } = req.params;
      const { notes } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        throw new AppError('Unauthorized', 401);
      }

      // 管理者チェックは isAdmin middleware で実施済み

      // ユーザー拒否
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          approval_status: 'rejected',
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          approved_by: adminId,
        })
        .eq('id', targetUserId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to reject user:', error);
        throw new AppError('Failed to reject user', 500);
      }

      // メールアドレス取得
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

      logger.info(`Admin ${adminId} rejected user ${targetUserId} (${authUser.user?.email})`);

      res.json({
        success: true,
        data: {
          user: {
            ...data,
            email: authUser.user?.email,
          },
        },
        message: 'User rejected successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * ユーザー承認ステータス統計
   */
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // 管理者チェックは isAdmin middleware で実施済み

      // ステータス別集計
      const { data: pending } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      const { data: approved } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'approved');

      const { data: rejected } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'rejected');

      // 今日の登録者数
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySignups } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`);

      res.json({
        success: true,
        data: {
          stats: {
            pending: pending || 0,
            approved: approved || 0,
            rejected: rejected || 0,
            todaySignups: todaySignups || 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
