import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes, RateLimiterAbstract } from 'rate-limiter-flexible';
import { getRedisClient } from '../config/redis';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * レート制限ミドルウェア (Redis対応)
 *
 * セキュリティ対策:
 * - ブルートフォース攻撃の防止
 * - DoS攻撃の防止
 * - API料金爆発の防止
 *
 * 本番環境:
 * - Redis を使用（複数サーバー間で共有）
 * - サーバー再起動でもカウント維持
 *
 * 開発環境:
 * - メモリベース（Redis未設定時）
 */

const redisClient = getRedisClient();

// Rate limiter のベースオプション
interface RateLimiterOptions {
  points: number;
  duration: number;
  blockDuration: number;
}

// Redis または Memory ベースの Rate Limiter を作成
function createRateLimiter(options: RateLimiterOptions): RateLimiterAbstract {
  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl',
      ...options,
    });
  } else {
    logger.warn('Using in-memory rate limiter (not recommended for production)');
    return new RateLimiterMemory(options);
  }
}

// ログインエンドポイント用のレート制限（厳しめ）
// 5分間に5回まで
const loginLimiter = createRateLimiter({
  points: 5,          // 5回のリクエストまで
  duration: 300,      // 5分間（300秒）
  blockDuration: 900, // ブロック時間: 15分
});

// 登録エンドポイント用のレート制限（厳しめ）
// 1時間に3回まで
const signupLimiter = createRateLimiter({
  points: 3,           // 3回のリクエストまで
  duration: 3600,      // 1時間
  blockDuration: 3600, // ブロック時間: 1時間
});

// コード解析エンドポイント用のレート制限（中程度）
// 1分間に10回まで（APIコストを考慮）
const analyzeLimiter = createRateLimiter({
  points: 10,         // 10回のリクエストまで
  duration: 60,       // 1分間
  blockDuration: 300, // ブロック時間: 5分
});

// 一般APIエンドポイント用のレート制限（緩め）
// 1分間に30回まで
const generalLimiter = createRateLimiter({
  points: 30,         // 30回のリクエストまで
  duration: 60,       // 1分間
  blockDuration: 60,  // ブロック時間: 1分
});

// Admin APIエンドポイント用のレート制限（厳しめ）
// 1分間に5回まで
const adminLimiter = createRateLimiter({
  points: 5,          // 5回のリクエストまで
  duration: 60,       // 1分間
  blockDuration: 300, // ブロック時間: 5分
});

/**
 * レート制限ミドルウェアのファクトリー関数
 */
function createRateLimitMiddleware(limiter: RateLimiterMemory, name: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // IPアドレスを識別子として使用（ユーザー認証前でも機能）
      const key = req.ip || req.socket.remoteAddress || 'unknown';

      await limiter.consume(key);

      // 成功: 次のミドルウェアへ
      next();
    } catch (rateLimiterRes) {
      // レート制限超過
      if (rateLimiterRes instanceof Error) {
        logger.error(`Rate limiter error [${name}]:`, rateLimiterRes);
        return next(rateLimiterRes);
      }

      const result = rateLimiterRes as RateLimiterRes;
      const retryAfter = Math.ceil(result.msBeforeNext / 1000);

      logger.warn(
        `Rate limit exceeded [${name}]: IP=${req.ip}, RetryAfter=${retryAfter}s, Path=${req.path}`
      );

      // レート制限ヘッダーを設定
      res.set({
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limiter.points),
        'X-RateLimit-Remaining': String(result.remainingPoints),
        'X-RateLimit-Reset': String(new Date(Date.now() + result.msBeforeNext).toISOString()),
      });

      throw new AppError(
        `Too many requests. Please try again in ${retryAfter} seconds.`,
        429
      );
    }
  };
}

/**
 * エクスポート: 各エンドポイント用のミドルウェア
 */
export const rateLimitLogin = createRateLimitMiddleware(loginLimiter, 'Login');
export const rateLimitSignup = createRateLimitMiddleware(signupLimiter, 'Signup');
export const rateLimitAnalyze = createRateLimitMiddleware(analyzeLimiter, 'Analyze');
export const rateLimitGeneral = createRateLimitMiddleware(generalLimiter, 'General');
export const rateLimitAdmin = createRateLimitMiddleware(adminLimiter, 'Admin');

/**
 * 認証済みユーザー用のレート制限（より緩い制限）
 * ユーザーIDベースでレート制限
 */
export const createUserRateLimiter = (points: number, duration: number) => {
  const limiter = createRateLimiter({
    points,
    duration,
    blockDuration: duration,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 認証済みの場合はユーザーIDを使用、未認証の場合はIPアドレス
      const key = req.user?.id || req.ip || 'unknown';

      await limiter.consume(key);
      next();
    } catch (rateLimiterRes) {
      if (rateLimiterRes instanceof Error) {
        return next(rateLimiterRes);
      }

      const result = rateLimiterRes as RateLimiterRes;
      const retryAfter = Math.ceil(result.msBeforeNext / 1000);

      res.set({
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(points),
        'X-RateLimit-Remaining': String(result.remainingPoints),
      });

      throw new AppError(
        `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        429
      );
    }
  };
};
