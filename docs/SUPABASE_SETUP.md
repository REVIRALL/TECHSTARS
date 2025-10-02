# Supabase セットアップガイド

## 1. Supabase プロジェクト作成

### オンライン (本番環境)

1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. プロジェクト名: `vibecoding-production`
4. データベースパスワードを設定 (強力なパスワード)
5. リージョン選択: `Northeast Asia (Tokyo)`
6. プロジェクト作成

### ローカル開発環境

```bash
# Supabase CLI インストール
npm install -g supabase

# プロジェクトディレクトリで初期化
cd vibecoding
supabase init

# ローカルSupabase起動
supabase start

# 起動後、以下の情報が表示されます:
# - API URL: http://localhost:54321
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - anon key: xxxxx
# - service_role key: xxxxx
```

## 2. マイグレーション実行

### ローカル環境

```bash
# マイグレーション実行
supabase db push

# または個別に実行
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/20250101000000_initial_schema.sql
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/20250101000001_rls_policies.sql
```

### 本番環境 (Supabase Dashboard)

1. Supabase Dashboard → プロジェクト選択
2. 「SQL Editor」を開く
3. `supabase/migrations/20250101000000_initial_schema.sql` の内容をコピペして実行
4. `supabase/migrations/20250101000001_rls_policies.sql` の内容をコピペして実行

または CLI で:

```bash
# Supabase にログイン
supabase login

# プロジェクトとリンク
supabase link --project-ref your-project-ref

# マイグレーション実行
supabase db push
```

## 3. 認証設定

### メール認証

1. Dashboard → Authentication → Settings
2. 「Email Auth」を有効化
3. 「Confirm email」をON (本番環境推奨)
4. メールテンプレートをカスタマイズ (オプション)

### Google OAuth

1. Google Cloud Console で OAuth クライアント作成
   - https://console.cloud.google.com/
   - 「認証情報」→「OAuth 2.0 クライアント ID」作成
   - 承認済みのリダイレクト URI: `https://your-project.supabase.co/auth/v1/callback`

2. Supabase Dashboard → Authentication → Providers
3. Google を有効化
4. Client ID と Secret を入力

### GitHub OAuth

1. GitHub Settings → Developer settings → OAuth Apps
   - https://github.com/settings/developers
   - 「New OAuth App」をクリック
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`

2. Supabase Dashboard → Authentication → Providers
3. GitHub を有効化
4. Client ID と Secret を入力

## 4. 環境変数設定

### Backend (.env)

```bash
cd backend
cp .env.example .env
```

`.env` ファイルを編集:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Frontend (.env.local)

```bash
cd frontend
```

`.env.local` を作成:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. API キーの取得

1. Supabase Dashboard → Settings → API
2. 以下をコピー:
   - Project URL → `SUPABASE_URL`
   - anon public → `SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_KEY` (⚠️ 絶対に公開しない!)

## 6. データベース確認

### Supabase Studio

ローカル: http://localhost:54323
本番: https://app.supabase.com/project/your-project/editor

### テーブル確認

```sql
-- テーブル一覧
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ユーザーテーブル確認
SELECT * FROM users LIMIT 10;

-- 演習問題確認
SELECT title, difficulty, category FROM customization_exercises;
```

## 7. RLS (Row Level Security) 確認

```sql
-- RLSが有効か確認
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- ポリシー一覧
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

## 8. ストレージ設定 (画像アップロード用)

1. Dashboard → Storage
2. 「Create a new bucket」
3. バケット名: `avatars` (公開)
4. バケット名: `exports` (非公開)

RLS設定:

```sql
-- アバターバケット: 自分のファイルのみ操作可能
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

## 9. トラブルシューティング

### マイグレーションエラー

```bash
# マイグレーション状態確認
supabase migration list

# リセット (開発環境のみ!)
supabase db reset
```

### 接続エラー

- `.env` ファイルのURLとキーを再確認
- Supabase プロジェクトが起動しているか確認
- ネットワーク設定 (ファイアウォール等)

### RLSエラー

- service_role キーを使用しているか確認 (バックエンド)
- ユーザーが認証済みか確認
- ポリシーが正しく設定されているか確認

## 10. 次のステップ

✅ Supabase セットアップ完了

次は:
- バックエンドAPI実装 (認証、コード解析)
- Supabase クライアント統合
- テストデータ投入
