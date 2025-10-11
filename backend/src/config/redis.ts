import Redis from 'ioredis';
import { logger } from '../utils/logger';

/**
 * Redis クライアント設定
 *
 * 用途:
 * - Rate Limiter のバックエンド（複数サーバー間で共有）
 * - セッションストア（将来的な拡張用）
 * - キャッシュ（将来的な拡張用）
 */

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  // Redis URL が未設定の場合、メモリベースにフォールバック
  if (!process.env.REDIS_URL) {
    const env = process.env.NODE_ENV || 'development';
    logger.warn(`REDIS_URL not set. Rate limiter will use in-memory storage (${env})`);
    return null;
  }

  // 既存の接続を返す
  if (redisClient) {
    return redisClient;
  }

  try {
    // Upstash Redis 接続（TLS必須）
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to create Redis client:', error);

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    return null;
  }
}

// Graceful shutdown
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}
