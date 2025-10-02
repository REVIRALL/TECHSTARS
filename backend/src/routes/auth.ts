import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    ユーザー登録
 * @access  Public
 */
router.post('/signup', authController.signup);

/**
 * @route   POST /api/auth/login
 * @desc    ログイン
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    トークンリフレッシュ
 * @access  Public
 */
router.post('/refresh', authController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    ログアウト
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    現在のユーザー情報取得
 * @access  Private
 */
router.get('/me', authController.getMe);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    パスワードリセットメール送信
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    パスワードリセット
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

export default router;
