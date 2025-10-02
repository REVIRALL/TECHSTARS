# VIBECODING - AI時代のエンジニア育成プラットフォーム

AIツール(Claude Code、ChatGPT等)が生成したコードを「理解」し、実務で活用できるエンジニアを7日間で育成する学習支援システム。

## 🏗️ プロジェクト構成

```
vibecoding/
├── backend/              # APIサーバー (Node.js + Express + TypeScript)
├── frontend/             # Webダッシュボード (Next.js 14)
├── extension/            # VSCode拡張機能 (TypeScript)
├── shared/               # 共通型定義
└── docs/                 # ドキュメント
```

## 🚀 クイックスタート

### 前提条件
- Node.js 20 LTS
- pnpm 8+
- VSCode

### セットアップ

```bash
# 依存関係インストール
pnpm install

# 環境変数設定
cp .env.example .env
# .env を編集してAPIキー等を設定

# 開発サーバー起動
pnpm dev
```

### 各プロジェクト個別起動

```bash
# バックエンド (http://localhost:3001)
cd backend && pnpm dev

# フロントエンド (http://localhost:3000)
cd frontend && pnpm dev

# VSCode拡張機能
cd extension && pnpm watch
# F5キーでデバッグ起動
```

## 📚 技術スタック

### バックエンド
- Node.js 20 LTS + Express
- TypeScript
- Supabase (PostgreSQL)
- Redis (Upstash)
- Claude API / OpenAI API

### フロントエンド
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query

### VSCode拡張
- TypeScript
- VSCode Extension API
- Webpack

## 🔧 開発コマンド

```bash
# 全プロジェクトのビルド
pnpm build

# テスト実行
pnpm test

# Lint + Format
pnpm lint
pnpm format

# 型チェック
pnpm type-check
```

## 📖 ドキュメント

- [開発フロー](../開発フロー.md)
- [技術仕様書](../VIBECODING_超詳細仕様書_v4.0_完全統合版.md)

## 📝 ライセンス

MIT

## 🤝 コントリビューション

プルリクエスト歓迎!

1. Fork する
2. Feature ブランチ作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'feat: Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Pull Request 作成
