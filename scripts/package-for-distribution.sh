#!/bin/bash

# ================================================================================
# VIBECODING 配布パッケージ作成スクリプト
# ================================================================================
# このスクリプトは3種類の配布パッケージを生成します：
# 1. 一般ユーザー向け: .vsixファイルのみ
# 2. 開発者向け: ソースコード全体（GitHub用）
# 3. エンタープライズ向け: Docker Compose構成
# ================================================================================

set -e  # エラーが発生したら即座に終了

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# バージョン取得
VERSION=$(node -p "require('./extension/package.json').version")
DIST_DIR="dist-packages"

log_info "VIBECODING v$VERSION 配布パッケージ作成開始"

# 配布ディレクトリの初期化
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# ================================================================================
# 1. 一般ユーザー向けパッケージ（.vsix）
# ================================================================================
log_info "1️⃣  一般ユーザー向けパッケージ作成中..."

# VSCode拡張機能のビルド
log_info "VSCode拡張機能をビルド中..."
cd extension
pnpm install --frozen-lockfile
pnpm run package
npx vsce package --out "../$DIST_DIR/vibecoding-$VERSION.vsix"
cd ..

# 配布用READMEの作成
cat > "$DIST_DIR/README-USERS.md" << 'EOF'
# VIBECODING VSCode拡張機能

## インストール方法

### 方法1: VSCodeから直接インストール（推奨）

1. VSCodeを開く
2. 拡張機能パネルを開く（Ctrl+Shift+X / Cmd+Shift+X）
3. 右上の「...」メニュー → 「VSIXからのインストール」
4. `vibecoding-X.X.X.vsix` を選択
5. VSCodeを再起動

### 方法2: コマンドライン

```bash
code --install-extension vibecoding-X.X.X.vsix
```

## 使い方

1. VSCodeを開き、左側のアクティビティバーから「VIBECODING」アイコンをクリック
2. ログイン（初回のみ）
3. コードを選択 → 右クリック → 「VIBECODINGで解説」

## トラブルシューティング

### 拡張機能が表示されない
→ VSCodeを完全に再起動してください

### ログインできない
→ インターネット接続を確認してください

## サポート

- GitHub: https://github.com/your-org/vibecoding/issues
- Email: support@vibecoding.com
EOF

log_success "一般ユーザー向けパッケージ作成完了: $DIST_DIR/vibecoding-$VERSION.vsix"

# ================================================================================
# 2. 開発者向けパッケージ（ソースコード）
# ================================================================================
log_info "2️⃣  開発者向けパッケージ作成中..."

DEV_PACKAGE="$DIST_DIR/vibecoding-dev-v$VERSION"
mkdir -p "$DEV_PACKAGE"

# 必要なファイルのコピー
log_info "ソースファイルをコピー中..."
rsync -av --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '*.vsix' \
  --exclude '.env' \
  --exclude '.env.local' \
  backend/ "$DEV_PACKAGE/backend/"

rsync -av --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.env.local' \
  frontend/ "$DEV_PACKAGE/frontend/"

rsync -av --progress \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude 'out' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.env' \
  extension/ "$DEV_PACKAGE/extension/"

# 共通ファイルとドキュメントのコピー
cp -r shared "$DEV_PACKAGE/" 2>/dev/null || :
cp -r docs "$DEV_PACKAGE/" 2>/dev/null || :
cp README.md "$DEV_PACKAGE/"
cp package.json "$DEV_PACKAGE/"
cp pnpm-workspace.yaml "$DEV_PACKAGE/"
cp .gitignore "$DEV_PACKAGE/"
cp -r .vscode "$DEV_PACKAGE/" 2>/dev/null || :

# 環境変数テンプレートのコピー
cp backend/.env.example "$DEV_PACKAGE/backend/" 2>/dev/null || :
cp frontend/.env.local.example "$DEV_PACKAGE/frontend/" 2>/dev/null || :

# 開発者向けREADME作成
cat > "$DEV_PACKAGE/SETUP.md" << 'EOF'
# VIBECODING 開発者向けセットアップガイド

## 前提条件

- Node.js 20 LTS
- pnpm 8+
- VSCode
- Supabase アカウント
- Claude API キー

## セットアップ手順

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local
nano frontend/.env.local
```

必須の環境変数:
- `ANTHROPIC_API_KEY`: Claude APIキー
- `SUPABASE_URL`: SupabaseプロジェクトURL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseサービスロールキー
- `JWT_SECRET`: JWT署名用シークレット

### 3. データベースセットアップ

```bash
cd backend
pnpm db:migrate
pnpm db:seed
```

### 4. 開発サーバー起動

```bash
# すべてのサービスを並列起動
pnpm dev

# または個別起動
cd backend && pnpm dev   # http://localhost:3001
cd frontend && pnpm dev  # http://localhost:3000
cd extension && pnpm watch  # F5でデバッグ
```

## 開発コマンド

```bash
pnpm dev         # 開発サーバー起動
pnpm build       # プロダクションビルド
pnpm test        # テスト実行
pnpm lint        # Lint
pnpm type-check  # 型チェック
pnpm clean       # クリーンアップ
```

## VSCode拡張機能のデバッグ

1. VSCodeで `extension` フォルダを開く
2. F5キーを押す
3. 新しいVSCodeウィンドウが開く（拡張機能が有効化された状態）

## トラブルシューティング

### ビルドエラー
```bash
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

### 型エラー
```bash
pnpm type-check
```

### データベース接続エラー
Supabaseの環境変数が正しいか確認してください。

## コントリビューション

1. Forkする
2. Feature branchを作成 (`git checkout -b feature/amazing-feature`)
3. Commitする (`git commit -m 'feat: Add amazing feature'`)
4. Pushする (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## ライセンス

MIT License
EOF

# ZIPで圧縮
cd "$DIST_DIR"
zip -r "vibecoding-dev-v$VERSION.zip" "vibecoding-dev-v$VERSION"
cd ..

log_success "開発者向けパッケージ作成完了: $DIST_DIR/vibecoding-dev-v$VERSION.zip"

# ================================================================================
# 3. エンタープライズ向けパッケージ（Docker Compose）
# ================================================================================
log_info "3️⃣  エンタープライズ向けパッケージ作成中..."

ENTERPRISE_PACKAGE="$DIST_DIR/vibecoding-enterprise-v$VERSION"
mkdir -p "$ENTERPRISE_PACKAGE"

# Dockerファイルとソースコードのコピー
rsync -av --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.env' \
  backend/ "$ENTERPRISE_PACKAGE/backend/"

rsync -av --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '*.log' \
  frontend/ "$ENTERPRISE_PACKAGE/frontend/"

# Docker関連ファイルのコピー
cp docker-compose.yml "$ENTERPRISE_PACKAGE/"
cp .env.docker.example "$ENTERPRISE_PACKAGE/.env.example"

# Nginxディレクトリ作成
mkdir -p "$ENTERPRISE_PACKAGE/nginx"

# Nginx設定ファイル作成
cat > "$ENTERPRISE_PACKAGE/nginx/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name _;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
        }
    }

    # HTTPS (本番環境用 - SSL証明書を配置してください)
    # server {
    #     listen 443 ssl;
    #     server_name your-domain.com;
    #
    #     ssl_certificate /etc/nginx/ssl/cert.crt;
    #     ssl_certificate_key /etc/nginx/ssl/cert.key;
    #
    #     location / {
    #         proxy_pass http://frontend;
    #         # ... (上記と同じproxy設定)
    #     }
    # }
}
EOF

# エンタープライズ向けREADME作成
cat > "$ENTERPRISE_PACKAGE/README.md" << 'EOF'
# VIBECODING Enterprise Edition

Docker Composeでオンプレミス環境にデプロイするためのパッケージです。

## システム要件

- Docker 24.0+
- Docker Compose 2.20+
- 4GB RAM以上
- 20GB ストレージ以上

## クイックスタート

### 1. 環境変数の設定

```bash
cp .env.example .env
nano .env
```

必須設定:
- `DB_PASSWORD`: PostgreSQLパスワード
- `JWT_SECRET`: JWT署名用シークレット（32文字以上のランダム文字列）
- `ANTHROPIC_API_KEY`: Claude APIキー

### 2. 起動

```bash
# イメージビルド
docker-compose build

# 起動
docker-compose up -d

# ログ確認
docker-compose logs -f
```

### 3. アクセス

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### 4. VSCode拡張機能の設定

VSCode設定で以下を変更:
```json
{
  "vibecoding.apiUrl": "http://localhost:3001"
}
```

## 本番環境デプロイ

### SSL/TLS設定

1. SSL証明書を配置:
```bash
mkdir -p nginx/ssl
cp your-cert.crt nginx/ssl/
cp your-cert.key nginx/ssl/
```

2. nginx.confのHTTPSセクションのコメントアウトを解除

3. 再起動:
```bash
docker-compose down
docker-compose up -d --profile production
```

## 運用

### バックアップ

```bash
# データベースバックアップ
docker-compose exec postgres pg_dump -U vibecoding vibecoding > backup_$(date +%Y%m%d).sql
```

### 復元

```bash
docker-compose exec -T postgres psql -U vibecoding vibecoding < backup_20240101.sql
```

### ログ確認

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### スケーリング

```bash
# バックエンドを3台にスケール
docker-compose up -d --scale backend=3
```

## トラブルシューティング

### コンテナが起動しない
```bash
docker-compose down
docker-compose up -d
docker-compose logs
```

### データベース接続エラー
```bash
docker-compose exec postgres psql -U vibecoding -d vibecoding
```

### ポート競合
`docker-compose.yml`のポート番号を変更してください。

## アップデート

```bash
# 停止
docker-compose down

# 最新版取得
git pull origin main

# 再ビルド
docker-compose build --no-cache

# 起動
docker-compose up -d
```

## サポート

- GitHub Issues: https://github.com/your-org/vibecoding/issues
- Email: enterprise@vibecoding.com
EOF

# ZIPで圧縮
cd "$DIST_DIR"
zip -r "vibecoding-enterprise-v$VERSION.zip" "vibecoding-enterprise-v$VERSION"
cd ..

log_success "エンタープライズ向けパッケージ作成完了: $DIST_DIR/vibecoding-enterprise-v$VERSION.zip"

# ================================================================================
# まとめ
# ================================================================================
echo ""
log_success "🎉 すべての配布パッケージ作成完了！"
echo ""
log_info "生成されたファイル:"
echo "  📦 一般ユーザー向け:"
echo "     - $DIST_DIR/vibecoding-$VERSION.vsix"
echo "     - $DIST_DIR/README-USERS.md"
echo ""
echo "  💻 開発者向け:"
echo "     - $DIST_DIR/vibecoding-dev-v$VERSION.zip"
echo ""
echo "  🏢 エンタープライズ向け:"
echo "     - $DIST_DIR/vibecoding-enterprise-v$VERSION.zip"
echo ""
log_info "配布方法:"
echo "  - 一般ユーザー: .vsixファイルを配布"
echo "  - 開発者: GitHub Releasesにzipファイルをアップロード"
echo "  - エンタープライズ: zipファイルを展開してdocker-compose up"
echo ""
