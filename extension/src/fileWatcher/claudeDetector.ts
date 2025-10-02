import * as vscode from 'vscode';
import * as fs from 'fs';

export interface ClaudeDetectionResult {
  isClaudeGenerated: boolean;
  detectionMethod: 'timestamp' | 'pattern' | 'manual';
  confidence: number; // 0-1
}

/**
 * Claude Code 検知器
 */
export class ClaudeDetector {
  private recentTimestamps: Map<string, number> = new Map();
  private readonly TIMESTAMP_THRESHOLD = 2000; // 2秒以内なら Claude Code 疑い

  /**
   * ファイルがClaude Codeで生成されたか判定
   */
  async detect(document: vscode.TextDocument): Promise<ClaudeDetectionResult> {
    // 1. タイムスタンプベース検知
    const timestampResult = this.detectByTimestamp(document);
    if (timestampResult.isClaudeGenerated) {
      return timestampResult;
    }

    // 2. パターンベース検知
    const patternResult = this.detectByPattern(document);
    if (patternResult.confidence > 0.7) {
      return patternResult;
    }

    // デフォルト: Claude生成ではない
    return {
      isClaudeGenerated: false,
      detectionMethod: 'manual',
      confidence: 0,
    };
  }

  /**
   * タイムスタンプベース検知
   * VSCodeの保存イベントと Claude Code の生成タイミングを比較
   */
  private detectByTimestamp(document: vscode.TextDocument): ClaudeDetectionResult {
    const filePath = document.uri.fsPath;
    const now = Date.now();

    try {
      const stats = fs.statSync(filePath);
      const modifiedTime = stats.mtimeMs;
      const timeDiff = now - modifiedTime;

      // 最近保存されたファイルのタイムスタンプ記録
      if (!this.recentTimestamps.has(filePath)) {
        this.recentTimestamps.set(filePath, modifiedTime);
        return {
          isClaudeGenerated: false,
          detectionMethod: 'timestamp',
          confidence: 0,
        };
      }

      const prevTime = this.recentTimestamps.get(filePath)!;
      const changeInterval = modifiedTime - prevTime;

      // 短時間で大量のファイルが生成された場合、Claude Code の可能性
      if (changeInterval < this.TIMESTAMP_THRESHOLD && document.lineCount > 10) {
        this.recentTimestamps.set(filePath, modifiedTime);
        return {
          isClaudeGenerated: true,
          detectionMethod: 'timestamp',
          confidence: 0.8,
        };
      }

      this.recentTimestamps.set(filePath, modifiedTime);
    } catch (error) {
      // ファイル情報取得失敗
    }

    return {
      isClaudeGenerated: false,
      detectionMethod: 'timestamp',
      confidence: 0,
    };
  }

  /**
   * パターンベース検知
   * コード内のパターンからClaude Code生成を推測
   */
  private detectByPattern(document: vscode.TextDocument): ClaudeDetectionResult {
    const text = document.getText();
    let score = 0;
    let indicators = 0;

    // Claude Codeの典型的なパターン
    const patterns = [
      // コメントパターン
      /\/\*\*\s*\n\s*\*\s*.*\n\s*\*\//g, // JSDoc形式コメント
      /# TODO:/g,
      /# FIXME:/g,

      // 構造パターン
      /export (default )?(function|class|const)/g, // ES6 export
      /import .* from ['"].*['"];/g, // ES6 import
      /interface \w+ \{/g, // TypeScript interface

      // よく使われる関数名
      /function handleSubmit/g,
      /function validateInput/g,
      /async function fetchData/g,

      // エラーハンドリング
      /try \{[\s\S]*?\} catch/g,
      /\.catch\(/g,
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        indicators++;
        score += matches.length * 0.1;
      }
    });

    // コードの整形度チェック
    const lines = document.getText().split('\n');
    const properlyIndented = lines.filter(line => {
      const match = line.match(/^(\s*)/);
      return match && match[1].length % 2 === 0; // 偶数スペース
    }).length;

    const indentationScore = properlyIndented / lines.length;

    // 総合スコア
    const confidence = Math.min((score + indentationScore) / 2, 1.0);

    return {
      isClaudeGenerated: confidence > 0.7,
      detectionMethod: 'pattern',
      confidence,
    };
  }

  /**
   * 手動トリガー (ユーザーが明示的に「解析」を実行)
   */
  manualDetection(): ClaudeDetectionResult {
    return {
      isClaudeGenerated: false,
      detectionMethod: 'manual',
      confidence: 1.0,
    };
  }

  /**
   * キャッシュクリア
   */
  clearCache(): void {
    this.recentTimestamps.clear();
  }
}
