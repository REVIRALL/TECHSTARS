import express, { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate } from '../middleware/authenticate';
import { isAdmin } from '../middleware/isAdmin';
import { rateLimitAdmin } from '../middleware/rateLimiter';

const router: express.Router = Router();

// 全てのルートで認証必須 + 管理者権限チェック + レート制限（管理者API保護）
router.use(rateLimitAdmin);
router.use(authenticate);
router.use(isAdmin);

/**
 * @route GET /api/admin/users
 * @desc 全ユーザー一覧取得（管理者専用）
 * @access Admin
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route GET /api/admin/stats
 * @desc ユーザー承認統計取得（管理者専用）
 * @access Admin
 */
router.get('/stats', adminController.getUserStats);

/**
 * @route POST /api/admin/users/:userId/approve
 * @desc ユーザー承認（管理者専用）
 * @access Admin
 */
router.post('/users/:userId/approve', adminController.approveUser);

/**
 * @route POST /api/admin/users/:userId/reject
 * @desc ユーザー拒否（管理者専用）
 * @access Admin
 */
router.post('/users/:userId/reject', adminController.rejectUser);

export default router;
