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
プログラミングを初めて学ぶ小学生から社会人まで、誰でも理解できるように教えてください。

**重要な制約:**
- 絵文字や記号は一切使用しないでください
- 純粋なMarkdown形式のみで記述してください
- 過度にカジュアルな表現は避けてください

**超初心者向け解説ルール:**

1. **すべてのプログラミング用語を日本語で解説する**
   例:
   - 変数（へんすう）: データを入れておく箱のようなもの
   - 関数（かんすう）: 特定の処理をまとめた部品、道具箱のようなもの
   - 引数（ひきすう）: 関数に渡す材料、情報
   - 戻り値（もどりち）: 関数が処理した結果として返ってくる答え
   - 配列（はいれつ）: 複数のデータをまとめて入れておける棚のようなもの
   - オブジェクト: 関連する情報をまとめて管理する入れ物
   - メソッド: オブジェクトが持っている機能、できること
   - プロパティ: オブジェクトが持っている情報、特徴
   - if文: もし～ならば、という条件分岐の命令
   - for文: 繰り返し処理をする命令
   - true: 正しい、はい、という意味
   - false: 正しくない、いいえ、という意味
   - const: 変更できない値を入れる箱を作る命令
   - let: 変更できる値を入れる箱を作る命令
   - return: 関数から答えを返す命令

2. **日常生活の例え話で説明する**
   - コンピューターに対する命令は、料理のレシピのようなもの
   - 変数は、引き出しに物を入れて名前をつけるようなもの
   - 関数は、ボタンを押すと決まった作業をしてくれる機械のようなもの

3. **1行ずつ、何をしているか説明する**
   - コードを小さく分けて、それぞれが何をしているか説明
   - 「このコードは〇〇をするための命令です」と明確に述べる

4. **なぜそう書くのか、理由を必ず説明する**
   - 「こう書く理由は～」
   - 「もしこう書かないと～になってしまいます」

**解説の構成:**

1. **このコードは何をするコード？**
   - 小学生でもわかる一文で要約
   - 日常生活で例えるなら何に似ているか

2. **コードを1行ずつ解説**
   - 各行が何をしているか
   - 使われている用語の意味（すべて日本語で解説）
   - なぜその書き方をするのか

3. **実際に動かすとどうなる？**
   - 具体的な例を使って実行結果を説明
   - 入力と出力を明確に示す

4. **よくある間違いと注意点**
   - 初心者が間違えやすいポイント
   - 正しい書き方と間違った書き方の比較

5. **次に学ぶといいこと**
   - このコードを理解したら次に学べる内容
   - 関連する基礎知識
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
 * Markdown記法をプレーンテキストに変換
 */
function removeMarkdown(text: string): string {
  let result = text;

  // コードブロック（```）を削除
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    // コードブロック内のコードだけ残す
    return match.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
  });

  // インラインコード（`code`）の記号のみ削除
  result = result.replace(/`([^`]+)`/g, '$1');

  // 見出し記号（# ## ###）を削除
  result = result.replace(/^#{1,6}\s+/gm, '');

  // 太字（**text** または __text__）の記号のみ削除
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
  result = result.replace(/__([^_]+)__/g, '$1');

  // 斜体（*text* または _text_）の記号のみ削除
  result = result.replace(/\*([^*]+)\*/g, '$1');
  result = result.replace(/_([^_]+)_/g, '$1');

  // リンク（[text](url)）をテキストのみ残す
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // リスト記号（- または *）を削除
  result = result.replace(/^[\-\*]\s+/gm, '');

  // 引用記号（>）を削除
  result = result.replace(/^>\s+/gm, '');

  // 水平線（--- または ***）を削除
  result = result.replace(/^[\-\*]{3,}$/gm, '');

  // 絵文字を削除
  result = result.replace(/[🎯📦💡✨⚡🔧🚀📝]/g, '');

  return result;
}

/**
 * Claude レスポンスをパース
 */
function parseExplanationResponse(
  response: string,
  level: string
): Omit<ExplanationResponse, 'generationTimeMs'> {
  // Markdown記法を削除してプレーンテキストに変換
  const plainText = removeMarkdown(response);

  // 最初の行または最初の段落をサマリーとして抽出
  const lines = plainText.trim().split('\n').filter(line => line.trim());
  const summary = lines[0] ? lines[0].substring(0, 200) : 'コードの解説';

  // キーコンセプトを推定（元のMarkdownから見出しを抽出）
  const keyConcepts: string[] = [];
  const headingMatches = response.match(/^##\s+(.+)$/gm);
  if (headingMatches) {
    headingMatches.slice(0, 5).forEach(match => {
      const concept = match.replace(/^##\s+/, '').replace(/[🎯📦💡✨⚡🔧🚀📝*_#]/g, '').trim();
      if (concept) keyConcepts.push(concept);
    });
  }

  // 複雑度を推定（コードの長さとキーワードから）
  const complexityScore = Math.min(10, Math.max(1, Math.floor(plainText.length / 1000) + keyConcepts.length));

  return {
    content: plainText,
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
