import express, { Router } from 'express';
import { analyzeController } from '../controllers/analyzeController';
import { authenticate } from '../middleware/authenticate';
import { checkPlanLimit } from '../middleware/checkPlanLimit';
import { rateLimitAnalyze, rateLimitGeneral } from '../middleware/rateLimiter';
import { validateCodeSize, addCodeSizeLimitHeaders } from '../middleware/validateCodeSize';

const router: express.Router = Router();

/**
 * @route   POST /api/analyze
 * @desc    コード解析・解説生成
 * @access  Private
 * @security レート制限: 1分間に10回まで（API料金爆発防止）
 * @security コードサイズ制限: 全プラン共通 1MB (1,000KB)
 */
router.post('/', rateLimitAnalyze, authenticate, validateCodeSize, checkPlanLimit('analyses'), analyzeController.analyzeCode);

/**
 * @route   GET /api/analyze/history
 * @desc    解析履歴取得
 * @access  Private
 * @security レート制限: 1分間に30回まで
 */
router.get('/history', rateLimitGeneral, authenticate, addCodeSizeLimitHeaders, analyzeController.getHistory);

/**
 * @route   GET /api/analyze/:id
 * @desc    解析結果詳細取得
 * @access  Private
 * @security レート制限: 1分間に30回まで
 */
router.get('/:id', rateLimitGeneral, authenticate, analyzeController.getAnalysisById);

/**
 * @route   DELETE /api/analyze/:id
 * @desc    解析結果削除
 * @access  Private
 * @security レート制限: 1分間に30回まで
 */
router.delete('/:id', rateLimitGeneral, authenticate, analyzeController.deleteAnalysis);

export default router;
