import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * コードサイズ制限ミドルウェア
 *
 * セキュリティ要件:
 * - Claude API コスト爆発を防止
 * - プラン別に制限を設定可能
 * - 制限超過時は明確なエラーメッセージを返す
 *
 * @security CRITICAL - API料金保護に必須
 */

// コードサイズ制限 (文字数) - 全プラン共通
const CODE_SIZE_LIMITS = {
  free: 1000000,        // 1MB (約250,000トークン)
  standard: 1000000,    // 1MB (約250,000トークン)
  professional: 1000000, // 1MB (約250,000トークン)
  enterprise: 1000000,   // 1MB (約250,000トークン)
};

// 絶対的な上限 (どのプランでも超えられない)
const ABSOLUTE_MAX_SIZE = 1000000; // 1MB (約250,000トークン)

export const validateCodeSize = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;

    // コードが存在しない場合はスキップ (他のバリデーションで処理)
    if (!code) {
      return next();
    }

    const codeSize = code.length;
    const plan = req.user?.plan || 'free';

    // プラン別制限取得
    const limit = CODE_SIZE_LIMITS[plan as keyof typeof CODE_SIZE_LIMITS] || CODE_SIZE_LIMITS.free;

    // 絶対的上限チェック (セキュリティ: プラン関係なく超巨大コードを拒否)
    if (codeSize > ABSOLUTE_MAX_SIZE) {
      logger.warn(
        `Code size exceeded absolute limit: user=${req.user?.id}, size=${codeSize}, limit=${ABSOLUTE_MAX_SIZE}`
      );

      throw new AppError(
        `Code size too large. Maximum allowed is ${Math.floor(ABSOLUTE_MAX_SIZE / 1000)}KB. Your code is ${Math.floor(codeSize / 1000)}KB.`,
        413 // Payload Too Large
      );
    }

    // プラン別制限チェック
    if (codeSize > limit) {
      logger.warn(
        `Code size exceeded plan limit: user=${req.user?.id}, plan=${plan}, size=${codeSize}, limit=${limit}`
      );

      throw new AppError(
        `Code size exceeds the limit (${Math.floor(limit / 1000)}KB). Your code is ${Math.floor(codeSize / 1000)}KB.`,
        413 // Payload Too Large
      );
    }

    logger.debug(`Code size validation passed: size=${codeSize}, limit=${limit}, plan=${plan}`);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * コードサイズ情報をレスポンスヘッダーに追加するミドルウェア
 * クライアント側で制限を事前に知ることができる
 */
export const addCodeSizeLimitHeaders = (req: Request, res: Response, next: NextFunction) => {
  const plan = req.user?.plan || 'free';
  const limit = CODE_SIZE_LIMITS[plan as keyof typeof CODE_SIZE_LIMITS] || CODE_SIZE_LIMITS.free;

  res.set({
    'X-Code-Size-Limit': String(limit),
    'X-Code-Size-Limit-Absolute': String(ABSOLUTE_MAX_SIZE),
  });

  next();
};
