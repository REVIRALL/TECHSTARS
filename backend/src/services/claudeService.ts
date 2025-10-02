import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { logger } from '../utils/logger';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

export interface ExplanationRequest {
  code: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface ExplanationResponse {
  content: string;
  summary: string;
  keyConcepts: string[];
  complexityScore: number;
  generationTimeMs: number;
}

/**
 * Claude APIを使ってコード解説を生成
 */
export async function generateExplanation(
  request: ExplanationRequest
): Promise<ExplanationResponse> {
  const startTime = Date.now();

  try {
    const prompt = buildPrompt(request);

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // レスポンスをパース
    const parsed = parseExplanationResponse(responseText, request.level);

    const generationTimeMs = Date.now() - startTime;

    logger.info(
      `Explanation generated: ${request.language}, level: ${request.level}, time: ${generationTimeMs}ms`
    );

    return {
      ...parsed,
      generationTimeMs,
    };
  } catch (error) {
    logger.error('Claude API error:', error);
    throw new Error('Failed to generate explanation');
  }
}

/**
 * レベル別プロンプト構築
 */
function buildPrompt(request: ExplanationRequest): string {
  const { code, language, level } = request;

  const levelInstructions = {
    beginner: `
あなたは初心者向けのプログラミング講師です。
以下の${language}コードを、プログラミング未経験者でも理解できるように、優しく丁寧に解説してください。

解説には以下を含めてください:
1. コード全体が何をしているか (1-2文で要約)
2. 各部分の詳しい説明 (変数、関数、条件分岐など)
3. 重要な概念の説明 (初心者向けに噛み砕いて)
4. このコードから学べること

専門用語は必ず日本語で説明してください。
`,
    intermediate: `
あなたは中級者向けのプログラミングメンターです。
以下の${language}コードを、基礎は理解している学習者向けに解説してください。

解説には以下を含めてください:
1. コードの目的と全体構造 (要約)
2. 主要な処理フローの説明
3. 使用されているパターンやベストプラクティス
4. 改善点や注意すべきポイント
5. 関連する発展的な概念

適度な技術用語を使用しつつ、理解しやすさを重視してください。
`,
    advanced: `
あなたは上級者向けの技術エキスパートです。
以下の${language}コードを、実務経験者向けに詳細に分析してください。

解説には以下を含めてください:
1. アーキテクチャとデザインパターンの分析
2. パフォーマンスとスケーラビリティの考察
3. セキュリティ上の懸念点
4. コード品質とメンテナンス性の評価
5. 改善提案と代替実装アプローチ

技術的に正確で、実務的な観点から解説してください。
`,
  };

  return `
${levelInstructions[level]}

**コード:**
\`\`\`${language}
${code}
\`\`\`

**出力形式 (JSON):**
{
  "summary": "コードの要約 (1-2文)",
  "explanation": "詳細な解説 (Markdown形式)",
  "keyConcepts": ["概念1", "概念2", "概念3"],
  "complexityScore": 1-10の複雑度スコア
}

JSONのみを出力してください。
`;
}

/**
 * Claude レスポンスをパース
 */
function parseExplanationResponse(
  response: string,
  level: string
): Omit<ExplanationResponse, 'generationTimeMs'> {
  try {
    // JSON部分を抽出 (```json ``` で囲まれている場合を考慮)
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;

    const parsed = JSON.parse(jsonString);

    return {
      content: parsed.explanation || '',
      summary: parsed.summary || '',
      keyConcepts: parsed.keyConcepts || [],
      complexityScore: parsed.complexityScore || 5,
    };
  } catch (error) {
    logger.error('Failed to parse Claude response:', error);

    // パース失敗時はテキストをそのまま返す
    return {
      content: response,
      summary: 'コードの解説',
      keyConcepts: [],
      complexityScore: 5,
    };
  }
}

/**
 * フォールバック: OpenAI GPT-4
 */
export async function generateExplanationWithOpenAI(
  request: ExplanationRequest
): Promise<ExplanationResponse> {
  // TODO: OpenAI API実装
  throw new Error('OpenAI fallback not implemented yet');
}
