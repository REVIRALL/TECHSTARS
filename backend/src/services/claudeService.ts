import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { logger } from '../utils/logger';

// API Keyの存在チェック
if (!config.anthropic.apiKey) {
  logger.error('ANTHROPIC_API_KEY is not set');
  throw new Error('ANTHROPIC_API_KEY is required');
}

logger.info('Initializing Anthropic SDK', {
  apiKeyPresent: !!config.anthropic.apiKey,
  apiKeyLength: config.anthropic.apiKey?.length || 0,
});

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

logger.info('Anthropic SDK initialized', {
  hasMessages: !!anthropic.messages,
  anthropicType: typeof anthropic,
  messagesType: typeof anthropic.messages,
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
/**
 * コードの複雑度を計算してmax_tokensを決定
 */
function calculateMaxTokens(code: string): number {
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  const lineCount = lines.length;

  // 複雑度指標をカウント
  const functionCount = (code.match(/function\s+\w+/g) || []).length;
  const classCount = (code.match(/class\s+\w+/g) || []).length;
  const ifCount = (code.match(/\bif\s*\(/g) || []).length;
  const loopCount = (code.match(/\b(for|while)\s*\(/g) || []).length;
  const complexityScore = functionCount * 3 + classCount * 5 + ifCount + loopCount;

  // コード量と複雑度に応じてトークン数を決定（Claude Sonnet 4: max 64,000 tokens）
  // 7段階: 1000 → 2000 → 4000 → 8000 → 16000 → 24000 → 40000
  if (lineCount <= 5 && complexityScore <= 1) {
    return 1000; // 超小規模: ワンライナー・簡単な関数
  } else if (lineCount <= 15 && complexityScore <= 5) {
    return 2000; // 小規模: シンプルな関数・小さい変更
  } else if (lineCount <= 40 && complexityScore <= 15) {
    return 4000; // 中規模: 複数の関数・中程度の変更
  } else if (lineCount <= 80 && complexityScore <= 30) {
    return 8000; // 大規模: クラス全体・大きめの機能
  } else if (lineCount <= 150 && complexityScore <= 60) {
    return 16000; // 超大規模: 複数ファイル・複雑なロジック
  } else if (lineCount <= 300 && complexityScore <= 120) {
    return 24000; // 巨大規模: モジュール全体・アーキテクチャ
  } else {
    return 40000; // 最大規模: システム全体・フルスタック解析
  }
}

export async function generateExplanation(
  request: ExplanationRequest
): Promise<ExplanationResponse> {
  const startTime = Date.now();

  try {
    const prompt = buildPrompt(request);
    const maxTokens = calculateMaxTokens(request.code);

    logger.info(`Code analysis: lines=${request.code.split('\n').length}, max_tokens=${maxTokens}`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
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
あなたは優しくて親切なプログラミングの先生です。
初めてプログラミングに触れる生徒に、わかりやすく丁寧に教えてください。

**重要な制約:**
- 絵文字や記号は一切使用しないでください
- 純粋なMarkdown形式のみで記述してください
- 過度にカジュアルな表現は避けてください

**解説の書き方:**
1. 専門用語は日常的な言葉で説明する
2. 具体例を必ず含める
3. なぜそのように書くのか理由を説明する
4. コードのポイントや注意点を明記する

**解説の構成:**

1. **概要** - このコードが何をするのか簡潔に説明
2. **詳細説明** - コードの各部分を分解して解説
3. **実行例** - 実際に使った場合の動作例
4. **重要なポイント** - 覚えておくべき点、よくある間違い
5. **次のステップ** - 関連する学習内容の提案
`,
    intermediate: `
あなたは中級者向けのプログラミングメンターです。
以下の${language}コードを、基礎は理解している学習者向けに解説してください。

**重要な制約:**
- 絵文字や記号は一切使用しないでください
- 純粋なMarkdown形式のみで記述してください

解説には以下を含めてください:
1. コードの目的と全体構造
2. 主要な処理フローの説明
3. 使用されているパターンやベストプラクティス
4. 改善点や注意すべきポイント
5. 関連する発展的な概念

適度な技術用語を使用しつつ、理解しやすさを重視してください。
`,
    advanced: `
あなたは上級者向けの技術エキスパートです。
以下の${language}コードを、実務経験者向けに詳細に分析してください。

**重要な制約:**
- 絵文字や記号は一切使用しないでください
- 純粋なMarkdown形式のみで記述してください

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

詳細な解説をMarkdown形式で出力してください。構造化されたJSONではなく、純粋なMarkdownテキストで記述してください。
`;
}

/**
 * Claude レスポンスをパース
 */
function parseExplanationResponse(
  response: string,
  level: string
): Omit<ExplanationResponse, 'generationTimeMs'> {
  // Markdownレスポンスをそのまま使用
  // 最初の行または最初の段落をサマリーとして抽出
  const lines = response.trim().split('\n').filter(line => line.trim());
  const summary = lines[0] ? lines[0].replace(/^#+\s*/, '').substring(0, 200) : 'コードの解説';

  // キーコンセプトを推定（見出しから抽出）
  const keyConcepts: string[] = [];
  const headingMatches = response.match(/^##\s+(.+)$/gm);
  if (headingMatches) {
    headingMatches.slice(0, 5).forEach(match => {
      const concept = match.replace(/^##\s+/, '').replace(/[🎯📦💡✨⚡🔧🚀📝]/g, '').trim();
      if (concept) keyConcepts.push(concept);
    });
  }

  // 複雑度を推定（コードの長さとキーワードから）
  const complexityScore = Math.min(10, Math.max(1, Math.floor(response.length / 1000) + keyConcepts.length));

  return {
    content: response,
    summary: summary,
    keyConcepts: keyConcepts.length > 0 ? keyConcepts : ['プログラミング', level === 'beginner' ? '基礎' : level === 'intermediate' ? '応用' : '実践'],
    complexityScore: complexityScore,
  };
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
