import winston from 'winston';

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'vibecoding-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaString}`;
        })
      ),
    }),
  ],
});

// 本番環境ではファイルにも出力
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  );
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

/**
 * エラーオブジェクトを安全にフォーマット
 * セキュリティ: 本番環境ではスタックトレースや内部情報を除外
 */
export function sanitizeError(error: any): any {
  if (!error) return 'Unknown error';

  if (process.env.NODE_ENV === 'production') {
    // 本番環境: 公開可能な情報のみ
    return {
      message: error.message || 'An error occurred',
      code: error.code,
      status: error.status || error.statusCode,
    };
  }

  // 開発環境: デバッグのため詳細情報を含む
  return error;
}
