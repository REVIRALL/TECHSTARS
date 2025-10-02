import { Router } from 'express';
import { analyzeController } from '../controllers/analyzeController';
import { authenticate } from '../middleware/authenticate';
import { checkPlanLimit } from '../middleware/checkPlanLimit';

const router = Router();

/**
 * @route   POST /api/analyze
 * @desc    コード解析・解説生成
 * @access  Private
 */
router.post('/', authenticate, checkPlanLimit('analyses'), analyzeController.analyzeCode);

/**
 * @route   GET /api/analyze/history
 * @desc    解析履歴取得
 * @access  Private
 */
router.get('/history', authenticate, analyzeController.getHistory);

/**
 * @route   GET /api/analyze/:id
 * @desc    解析結果詳細取得
 * @access  Private
 */
router.get('/:id', authenticate, analyzeController.getAnalysisById);

/**
 * @route   DELETE /api/analyze/:id
 * @desc    解析結果削除
 * @access  Private
 */
router.delete('/:id', authenticate, analyzeController.deleteAnalysis);

export default router;
