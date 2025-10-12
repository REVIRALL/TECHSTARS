# 📦 TECHSTARS 配布ガイド完全版

## 🎯 3つの配布パターン

### パターン1: 一般ユーザー向け（推奨） ⭐
**対象**: プログラミング学習者、エンドユーザー
**難易度**: ★☆☆☆☆
**配布物**: VSCode拡張機能のみ（.vsix）

### パターン2: 開発者向け
**対象**: 自分でバックエンドを立てたい開発者
**難易度**: ★★★☆☆
**配布物**: GitHubリポジトリ（ソースコード全体）

### パターン3: エンタープライズ向け
**対象**: 企業内でプライベート運用したい組織
**難易度**: ★★★★☆
**配布物**: Docker Compose構成

---

## 1️⃣ 一般ユーザー向け配布

### 📁 配布フォルダ構成

```
TECHSTARS-Extension-v0.1.0/
├── vibecoding-0.1.0.vsix          # VSCode拡張機能パッケージ
├── README.md                       # インストール手順書
├── icon.png                        # アイコン画像（任意）
└── CHANGELOG.md                    # バージョン履歴（任意）
```

### 🔧 .vsixファイルの作成手順

```bash
# 1. 拡張機能ディレクトリに移動
cd extension

# 2. VSCEパッケージングツールのインストール
pnpm add -D @vscode/vsce

# 3. ビルド
pnpm run package

# 4. .vsixファイル生成
npx vsce package

# 完成！ vibecoding-extension-0.1.0.vsix が生成されます
```

### 📝 配布用README.mdの内容

```markdown
# TECHSTARS - AI時代のエンジニア育成VSCode拡張機能

VSCode上でAIが生成したコードを理解し、学習できる拡張機能です。

## 📥 インストール方法

### 方法1: VSIXファイルから直接インストール（推奨）

1. VSCodeを開く
2. 拡張機能パネルを開く（Ctrl+Shift+X / Cmd+Shift+X）
3. 右上の「...」メニュー → 「VSIXからのインストール」
4. `vibecoding-0.1.0.vsix` を選択
5. VSCodeを再起動

### 方法2: コマンドラインからインストール

```bash
code --install-extension vibecoding-0.1.0.vsix
```

## 🚀 使い方

1. VSCodeを開き、左側のアクティビティバーから「TECHSTARS」アイコンをクリック
2. ログイン（初回のみ）
3. コードを選択 → 右クリック → 「TECHSTARSで解説」

## ⚙️ 設定

VSCodeの設定から以下を変更できます：

- **vibecoding.apiUrl**: バックエンドAPIのURL（デフォルト: https://techstars.onrender.com）
- **vibecoding.explanationLevel**: 解説レベル（beginner / intermediate / advanced）
- **vibecoding.autoAnalyze**: 自動解析の有効/無効

## 🆘 トラブルシューティング

### Q: 拡張機能が動作しない
A: VSCodeを完全に再起動してください（File → Exit → 再起動）

### Q: ログインできない
A: バックエンドサーバーが起動しているか確認してください

### Q: 解説が表示されない
A: 設定でAPIURLが正しいか確認してください

## 📞 サポート

問題がある場合は、以下にお問い合わせください：
- GitHub Issues: https://github.com/your-org/vibecoding/issues
- Email: support@vibecoding.com

## 📄 ライセンス

MIT License
```

### 📦 配布物の作成

```bash
# 配布用フォルダ作成
mkdir -p TECHSTARS-Extension-v0.1.0

# .vsixファイルをコピー
cp extension/vibecoding-extension-0.1.0.vsix TECHSTARS-Extension-v0.1.0/

# README作成
cat > TECHSTARS-Extension-v0.1.0/README.md << 'EOF'
# TECHSTARS インストールガイド
（上記の内容を記載）
EOF

# ZIPで圧縮
zip -r TECHSTARS-Extension-v0.1.0.zip TECHSTARS-Extension-v0.1.0/
```

---

## 2️⃣ 開発者向け配布（GitHub経由）

### 📁 GitHubリポジトリ構成

```
vibecoding/                         # リポジトリルート
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # CI/CDパイプライン
│   │   └── release.yml            # リリース自動化
│   └── ISSUE_TEMPLATE/
├── backend/                        # バックエンドAPI
│   ├── src/
│   ├── package.json
│   ├── .env.example               # 環境変数テンプレート
│   └── README.md                  # バックエンド個別README
├── frontend/                       # Webダッシュボード
│   ├── app/
│   ├── package.json
│   ├── .env.local.example
│   └── README.md
├── extension/                      # VSCode拡張機能
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── shared/                         # 共通型定義
│   └── types/
├── docs/                           # ドキュメント
│   ├── SETUP.md                   # セットアップガイド
│   ├── ARCHITECTURE.md            # アーキテクチャ図
│   ├── API.md                     # API仕様書
│   └── DEPLOYMENT.md              # デプロイガイド
├── scripts/                        # 自動化スクリプト
│   ├── setup.sh                   # 初期セットアップ
│   └── build-all.sh               # 一括ビルド
├── .gitignore
├── .env.example                   # ルートレベル環境変数
├── package.json                   # ルートpackage.json
├── pnpm-workspace.yaml            # pnpm workspace設定
├── README.md                       # メインREADME
├── LICENSE                         # ライセンス
└── CONTRIBUTING.md                # コントリビューションガイド
```

### 📝 メインREADME.md（開発者向け）

```markdown
# TECHSTARS - AI時代のエンジニア育成プラットフォーム

AIツール(Claude Code、ChatGPT等)が生成したコードを「理解」し、実務で活用できるエンジニアを育成する学習支援システム。

## 🏗️ アーキテクチャ

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  VSCode     │─────→│  Backend     │─────→│  Supabase   │
│  Extension  │      │  API Server  │      │  (DB)       │
└─────────────┘      └──────────────┘      └─────────────┘
                             ↓
                     ┌──────────────┐
                     │  Claude API  │
                     │  (AI)        │
                     └──────────────┘
```

## 🚀 クイックスタート

### 前提条件
- Node.js 20 LTS
- pnpm 8+
- VSCode
- Supabase アカウント
- Claude API キー

### セットアップ

```bash
# 1. リポジトリクローン
git clone https://github.com/your-org/vibecoding.git
cd vibecoding

# 2. 依存関係インストール
pnpm install

# 3. 環境変数設定
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 4. 環境変数を編集
nano backend/.env  # ANTHROPIC_API_KEY, SUPABASE_URL等を設定

# 5. 開発サーバー起動
pnpm dev  # 全サービスが並列起動
```

## 📚 ドキュメント

- [セットアップガイド](docs/SETUP.md)
- [アーキテクチャ](docs/ARCHITECTURE.md)
- [API仕様](docs/API.md)
- [デプロイガイド](docs/DEPLOYMENT.md)

## 🔧 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# テスト
pnpm test

# Lint
pnpm lint

# 型チェック
pnpm type-check

# クリーンアップ
pnpm clean
```

## 📦 各コンポーネント

### Backend
Node.js + Express + TypeScript
```bash
cd backend
pnpm dev  # http://localhost:3001
```

### Frontend
Next.js 14
```bash
cd frontend
pnpm dev  # http://localhost:3000
```

### Extension
VSCode Extension
```bash
cd extension
pnpm watch  # F5でデバッグ起動
```

## 🤝 コントリビューション

[CONTRIBUTING.md](CONTRIBUTING.md)を参照

## 📄 ライセンス

MIT License
```

---

## 3️⃣ エンタープライズ向け配布（Docker Compose）

### 📁 Docker Compose構成

```
vibecoding-enterprise/
├── docker-compose.yml              # メイン構成ファイル
├── docker-compose.prod.yml         # 本番環境用
├── .env.example                    # 環境変数テンプレート
├── backend/
│   ├── Dockerfile
│   └── ...（ソースコード）
├── frontend/
│   ├── Dockerfile
│   └── ...（ソースコード）
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf                  # リバースプロキシ設定
├── scripts/
│   ├── setup.sh                    # 初期セットアップ
│   └── backup.sh                   # バックアップスクリプト
├── docs/
│   └── ENTERPRISE_SETUP.md         # エンタープライズ向けガイド
└── README.md
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL (Supabase代替)
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: vibecoding
      POSTGRES_USER: ${DB_USER:-vibecoding}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vibecoding"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis (キャッシュ)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/vibecoding
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  # Frontend Dashboard
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx (リバースプロキシ)
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    restart: unless-stopped

volumes:
  postgres_data:
```

### 📝 エンタープライズ向けREADME.md

```markdown
# TECHSTARS Enterprise Edition

企業内プライベート環境で運用するためのDocker Compose構成です。

## 📋 システム要件

- Docker 24.0+
- Docker Compose 2.20+
- 4GB RAM以上
- 20GB ストレージ以上

## 🚀 デプロイ手順

### 1. 環境変数設定

```bash
cp .env.example .env
nano .env
```

必要な環境変数:
- `DB_PASSWORD`: PostgreSQLパスワード
- `JWT_SECRET`: JWT署名用シークレット
- `ANTHROPIC_API_KEY`: Claude APIキー

### 2. 起動

```bash
# 初回セットアップ
./scripts/setup.sh

# 起動
docker-compose up -d

# ログ確認
docker-compose logs -f
```

### 3. アクセス

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Admin: http://localhost:3000/admin

### 4. VSCode拡張機能の設定

VSCodeの設定で以下を変更:
```json
{
  "vibecoding.apiUrl": "http://localhost:3001"
}
```

## 🔐 SSL/TLS設定（本番環境）

```bash
# SSL証明書配置
cp your-cert.crt ssl/
cp your-key.key ssl/

# HTTPS版で起動
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🔄 バックアップ

```bash
# データベースバックアップ
./scripts/backup.sh

# バックアップから復元
docker-compose exec postgres psql -U vibecoding -d vibecoding < backup.sql
```

## 🛠️ トラブルシューティング

### コンテナが起動しない
```bash
docker-compose logs backend
```

### データベース接続エラー
```bash
docker-compose exec postgres psql -U vibecoding -d vibecoding
```

### ポート競合
`docker-compose.yml`のポート番号を変更してください。

## 📊 監視

Prometheusメトリクス: http://localhost:3001/metrics

## 🆙 アップデート

```bash
# 最新版取得
git pull origin main

# 再ビルド
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
```

---

## 📊 配布方法の比較表

| 項目 | 一般ユーザー向け | 開発者向け | エンタープライズ向け |
|-----|-------------|----------|-----------------|
| **難易度** | ★☆☆☆☆ | ★★★☆☆ | ★★★★☆ |
| **セットアップ時間** | 5分 | 30分 | 2時間 |
| **カスタマイズ性** | 低 | 高 | 最高 |
| **必要な技術知識** | なし | Node.js, Git | Docker, インフラ |
| **バックエンド** | 公開サーバー使用 | 自分で構築 | プライベート運用 |
| **おすすめ用途** | 個人学習 | 機能開発 | 企業内運用 |

---

## 🔑 配布前チェックリスト

### すべての配布方法共通
- [ ] 機密情報（APIキー、パスワード）を削除
- [ ] .env.exampleを作成
- [ ] README.mdにインストール手順を記載
- [ ] LICENSEファイルを含める
- [ ] バージョン番号を更新

### 一般ユーザー向け
- [ ] .vsixファイルが正常に生成される
- [ ] VSCodeで正常にインストールできる
- [ ] アイコンが表示される
- [ ] サンプル動画/スクリーンショットを用意

### 開発者向け
- [ ] .gitignoreが適切
- [ ] CIテストがパスする
- [ ] ビルドエラーがない
- [ ] ドキュメントが最新

### エンタープライズ向け
- [ ] Docker Composeが正常に起動
- [ ] ヘルスチェックが正常
- [ ] SSL証明書の設定手順を記載
- [ ] バックアップ/リストア手順を記載

---

## 🚀 次のステップ

### 1. VSCode Marketplace公開（一般ユーザー向け）
```bash
# Microsoft Publisher IDを取得
https://marketplace.visualstudio.com/manage

# 公開
npx vsce publish
```

### 2. GitHub Releases（開発者向け）
```bash
# タグ作成
git tag v0.1.0
git push origin v0.1.0

# GitHub Releasesで.vsixを添付
```

### 3. プライベートレジストリ（エンタープライズ向け）
- Docker Registry構築
- Helm Chartパッケージング
- Kubernetes対応

---

## 📞 サポート

配布に関する質問は以下まで：
- GitHub Discussions: https://github.com/your-org/vibecoding/discussions
- Email: distribution@vibecoding.com
