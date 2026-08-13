import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const validateBusinessIdea = async (idea: string): Promise<string> => {
  if (!apiKey) {
    return "APIキーが設定されていないため、AI機能を利用できません。";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `あなたは熟練のベンチャーキャピタリスト兼プロダクトマネージャーです。
      以下のビジネスアイデアに対して、簡潔に3つの視点（1. 強み・市場性、2. 懸念されるリスク、3. 最初のアクション）でフィードバックを行ってください。
      トーンはプロフェッショナルかつ建設的に、日本語で出力してください。Markdown形式で出力してください。

      ビジネスアイデア: ${idea}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // 低レイテンシ重視
      }
    });

    return response.text || "フィードバックを生成できませんでした。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "現在AIサービスが混み合っており、応答できませんでした。後ほど再度お試しください。";
  }
};