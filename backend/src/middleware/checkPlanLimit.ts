import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * プラン制限チェックミドルウェア
 * 使用量が制限を超えていないか確認
 */
export const checkPlanLimit = (feature: 'analyses' | 'tests' | 'exercises' | 'projects' | 'api') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const userId = req.user.id;
      const plan = req.user.plan;

      // プラン制限取得
      const { data: planLimit, error: planError } = await supabaseAdmin
        .from('plan_limits')
        .select('*')
        .eq('plan', plan)
        .single();

      if (planError || !planLimit) {
        logger.error('Plan limit fetch error:', planError);
        throw new AppError('Plan configuration not found', 500);
      }

      // 機能別チェック
      switch (feature) {
        case 'analyses':
          await checkAnalysisLimit(userId, planLimit);
          break;
        case 'tests':
          if (!planLimit.test_generation_enabled) {
            throw new AppError('Test generation is not available in your plan', 403);
          }
          break;
        case 'exercises':
          if (!planLimit.customization_exercises_enabled) {
            throw new AppError('Customization exercises are not available in your plan', 403);
          }
          break;
        case 'projects':
          if (!planLimit.project_simulations_enabled) {
            throw new AppError('Project simulations are not available in your plan', 403);
          }
          break;
        case 'api':
          if (!planLimit.api_access_enabled) {
            throw new AppError('API access is not available in your plan', 403);
          }
          await checkApiLimit(userId, planLimit);
          break;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * コード解析回数制限チェック
 */
async function checkAnalysisLimit(userId: string, planLimit: any) {
  const today = new Date().toISOString().split('T')[0];

  // 本日の使用量取得
  const { data: usageToday, error: usageError } = await supabaseAdmin
    .from('usage_stats')
    .select('analyses_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (usageError && usageError.code !== 'PGRST116') {
    // PGRST116 = レコードなし (初回)
    logger.error('Usage stats fetch error:', usageError);
    throw new AppError('Failed to check usage limits', 500);
  }

  const currentCount = usageToday?.analyses_count || 0;
  const dailyLimit = planLimit.daily_analyses_limit;

  // -1 = 無制限
  if (dailyLimit === -1) {
    return;
  }

  if (currentCount >= dailyLimit) {
    throw new AppError(
      `Daily analysis limit reached (${dailyLimit} analyses/day). Please upgrade your plan.`,
      429
    );
  }
}

/**
 * API使用回数制限チェック
 */
async function checkApiLimit(userId: string, planLimit: any) {
  const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  // 今月の使用量集計 (簡易版: 実際はAPI専用カウンター推奨)
  const { count, error } = await supabaseAdmin
    .from('code_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', `${thisMonth}-01T00:00:00Z`);

  if (error) {
    logger.error('API usage check error:', error);
    throw new AppError('Failed to check API usage', 500);
  }

  const monthlyLimit = planLimit.api_requests_per_month;

  if (monthlyLimit === -1) {
    return;
  }

  if ((count || 0) >= monthlyLimit) {
    throw new AppError(
      `Monthly API limit reached (${monthlyLimit} requests/month). Please upgrade your plan.`,
      429
    );
  }
}

/**
 * 使用量カウンター更新（完全アトミック版）
 * 解析成功後に呼び出す
 *
 * Race Condition対策:
 * - PostgreSQL stored procedure (increment_usage_count) を使用
 * - INSERT ... ON CONFLICT DO UPDATE で完全アトミック
 * - 並列リクエストでもカウント消失なし
 */
export async function incrementUsageCount(
  userId: string,
  type: 'analyses' | 'tests' | 'exercises'
) {
  const today = new Date().toISOString().split('T')[0];

  try {
    const column = `${type}_count`;

    // PostgreSQL の stored procedure を呼び出し
    // 完全にアトミックな処理で Race Condition を排除
    const { error } = await supabaseAdmin.rpc('increment_usage_count', {
      p_user_id: userId,
      p_date: today,
      p_column_name: column
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error('Failed to increment usage count:', error);
    // エラーでも続行 (使用量記録は重要だがメイン処理は成功させる)
  }
}
