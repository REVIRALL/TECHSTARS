import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import analyzeRoutes from './routes/analyze';
import adminRoutes from './routes/admin';

// 環境変数読み込み
dotenv.config();

/**
 * 環境変数検証（起動時チェック）
 * セキュリティ: 必須環境変数の欠如による予期しない動作を防止
 */
function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  // AI API キーは少なくとも1つ必要
  const hasAiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  if (!hasAiKey) {
    logger.error('FATAL: At least one AI API key is required (ANTHROPIC_API_KEY or OPENAI_API_KEY)');
    process.exit(1);
  }

  // 本番環境固有の必須変数
  if (process.env.NODE_ENV === 'production') {
    required.push('ALLOWED_ORIGINS');
  }

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    logger.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  logger.info('Environment variables validated successfully');
}

// 環境変数検証を実行
validateEnvironment();

const app: express.Application = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Trust proxy設定（ロードバランサー/CDN配下でのIP取得用）
// 本番環境: Vercel/Render等のプロキシを信頼
// 開発環境: ローカル環境のため不要だが統一性のため設定
app.set('trust proxy', true);

// ミドルウェア
app.use(helmet());

// CORS設定（セキュリティ強化版）
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001']; // 開発環境デフォルト

// 本番環境では ALLOWED_ORIGINS 必須
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
  logger.error('FATAL: ALLOWED_ORIGINS must be set in production environment');
  process.exit(1);
}

// CORS設定を適用
app.use(cors({
  origin: (origin, callback) => {
    // ヘルスチェックとルートはCORSチェックをスキップ
    // (originがundefinedの場合は同一オリジンまたはヘルスチェッカー)
    if (!origin) {
      // 開発環境では常に許可
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      // 本番環境では警告を出すが、ヘルスチェッカーのため許可
      return callback(null, true);
    }

    // 許可リストチェック
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24時間（preflight cache）
}));
app.use(compression());

// JSON ペイロードサイズ制限
// コードサイズ制限 (最大150KB) + JSON構造オーバーヘッド考慮 → 200KB
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) },
}));

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ルート
app.get('/', (req, res) => {
  res.json({
    name: 'TECHSTARS API',
    version: '0.1.0',
    status: 'running',
  });
});

// ルート
app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/admin', adminRoutes);

// エラーハンドリング
app.use(errorHandler);

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
