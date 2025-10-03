import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { generateExplanation } from '../services/claudeService';
import { incrementUsageCount } from '../middleware/checkPlanLimit';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const analyzeController = {
  /**
   * コード解析・解説生成
   */
  async analyzeCode(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const {
        code,
        language,
        level = 'beginner',
        fileName,
        filePath,
        isClaudeGenerated = false,
        detectionMethod = 'manual',
      } = req.body;

      // バリデーション
      if (!code || !language) {
        throw new AppError('Code and language are required', 400);
      }

      if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
        throw new AppError('Invalid level. Must be beginner, intermediate, or advanced', 400);
      }

      // コードハッシュ生成 (重複チェック用)
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');

      // 重複チェック (同じコードを解析済みの場合、キャッシュから返す)
      const { data: existingAnalysis } = await supabaseAdmin
        .from('code_analyses')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('code_hash', codeHash)
        .eq('language', language)
        .single();

      if (existingAnalysis) {
        // 既存の解説を取得
        const { data: existingExplanation } = await supabaseAdmin
          .from('explanations')
          .select('*')
          .eq('code_analysis_id', existingAnalysis.id)
          .eq('level', level)
          .single();

        if (existingExplanation) {
          logger.info(`Returning cached explanation: ${existingAnalysis.id}`);

          return res.json({
            success: true,
            data: {
              analysisId: existingAnalysis.id,
              cached: true,
              explanation: existingExplanation,
            },
          });
        }
      }

      // AI解説生成
      const explanationResult = await generateExplanation({
        code,
        language,
        level,
      });

      // Code Analysis レコード作成
      const { data: analysis, error: analysisError } = await supabaseAdmin
        .from('code_analyses')
        .insert({
          user_id: req.user.id,
          code,
          code_hash: codeHash,
          language,
          file_name: fileName,
          file_path: filePath,
          is_claude_generated: isClaudeGenerated,
          detection_method: detectionMethod,
          detected_at: isClaudeGenerated ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (analysisError || !analysis) {
        logger.error('Code analysis insert error:', analysisError);
        throw new AppError('Failed to save code analysis', 500);
      }

      // Explanation レコード作成
      const { data: explanation, error: explanationError } = await supabaseAdmin
        .from('explanations')
        .insert({
          code_analysis_id: analysis.id,
          level,
          content: explanationResult.content,
          summary: explanationResult.summary,
          key_concepts: explanationResult.keyConcepts,
          complexity_score: explanationResult.complexityScore,
          ai_model: 'claude-3-5-sonnet-20241022',
          generation_time_ms: explanationResult.generationTimeMs,
        })
        .select()
        .single();

      if (explanationError || !explanation) {
        logger.error('Explanation insert error:', explanationError);
        throw new AppError('Failed to save explanation', 500);
      }

      // 使用量カウント更新
      await incrementUsageCount(req.user.id, 'analyses');

      logger.info(
        `Code analyzed: user=${req.user.id}, language=${language}, level=${level}, time=${explanationResult.generationTimeMs}ms`
      );

      res.status(201).json({
        success: true,
        data: {
          analysisId: analysis.id,
          cached: false,
          explanation: {
            id: explanation.id,
            content: explanation.content,
            summary: explanation.summary,
            keyConcepts: explanation.key_concepts,
            complexityScore: explanation.complexity_score,
            level: explanation.level,
            generationTimeMs: explanation.generation_time_ms,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 解析履歴取得
   */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { page = 1, limit = 20, language, isClaudeGenerated, startDate, endDate } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      let query = supabaseAdmin
        .from('code_analyses')
        .select('*, explanations(*)', { count: 'exact' })
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (language) {
        query = query.eq('language', language);
      }

      if (isClaudeGenerated !== undefined) {
        query = query.eq('is_claude_generated', isClaudeGenerated === 'true');
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        // endDateの終わりまで含める（23:59:59まで）
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDateTime.toISOString());
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('History fetch error:', error);
        throw new AppError('Failed to fetch history', 500);
      }

      res.json({
        success: true,
        data: {
          analyses: data || [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 解析結果詳細取得
   */
  async getAnalysisById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('code_analyses')
        .select('*, explanations(*)')
        .eq('id', id)
        .eq('user_id', req.user.id)
        .single();

      if (error || !data) {
        throw new AppError('Analysis not found', 404);
      }

      res.json({
        success: true,
        data: {
          analysis: data,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 解析結果削除
   */
  async deleteAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;

      // 所有者確認
      const { data: analysis } = await supabaseAdmin
        .from('code_analyses')
        .select('id')
        .eq('id', id)
        .eq('user_id', req.user.id)
        .single();

      if (!analysis) {
        throw new AppError('Analysis not found', 404);
      }

      // 削除 (CASCADE で explanations も削除される)
      const { error } = await supabaseAdmin.from('code_analyses').delete().eq('id', id);

      if (error) {
        logger.error('Delete analysis error:', error);
        throw new AppError('Failed to delete analysis', 500);
      }

      res.json({
        success: true,
        message: 'Analysis deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
