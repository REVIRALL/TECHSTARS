import express, { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { rateLimitLogin, rateLimitSignup, rateLimitGeneral } from '../middleware/rateLimiter';

const router: express.Router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    ユーザー登録
 * @access  Public
 * @security レート制限: 1時間に3回まで
 */
router.post('/signup', rateLimitSignup, authController.signup);

/**
 * @route   POST /api/auth/login
 * @desc    ログイン
 * @access  Public
 * @security レート制限: 5分間に5回まで（ブルートフォース攻撃対策）
 */
router.post('/login', rateLimitLogin, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    トークンリフレッシュ
 * @access  Public
 * @security レート制限: 1分間に30回まで
 */
router.post('/refresh', rateLimitGeneral, authController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    ログアウト
 * @access  Public
 * @security レート制限: 1分間に30回まで
 */
router.post('/logout', rateLimitGeneral, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    現在のユーザー情報取得
 * @access  Private
 * @security レート制限: 1分間に30回まで
 */
router.get('/me', rateLimitGeneral, authenticate, authController.getMe);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    パスワードリセットメール送信
 * @access  Public
 * @security レート制限: 1時間に3回まで（悪用防止）
 */
router.post('/forgot-password', rateLimitSignup, authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    パスワードリセット
 * @access  Public
 * @security レート制限: 1分間に30回まで
 */
router.post('/reset-password', rateLimitGeneral, authController.resetPassword);

export default router;
