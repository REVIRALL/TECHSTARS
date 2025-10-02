# データベース設計ドキュメント

## 概要

VIBECODINGのデータベース設計は、Supabase (PostgreSQL 15) をベースに構築されています。

**設計原則:**
- Supabase Auth との完全統合
- Row Level Security による厳格なアクセス制御
- JSONB による柔軟なデータ構造
- pgvector によるAI類似検索

---

## テーブル一覧

### コアテーブル (14テーブル)

| テーブル名 | 用途 | 重要度 |
|----------|------|--------|
| `profiles` | ユーザープロフィール (auth.users拡張) | ⭐⭐⭐ |
| `subscriptions` | サブスクリプション管理 | ⭐⭐⭐ |
| `plan_limits` | プラン別機能制限 | ⭐⭐⭐ |
| `code_analyses` | コード解析履歴 | ⭐⭐⭐ |
| `explanations` | AI解説データ | ⭐⭐⭐ |
| `learning_progress` | 7日間学習進捗 | ⭐⭐⭐ |
| `curriculum_days` | カリキュラム (7日分) | ⭐⭐⭐ |
| `curriculum_tasks` | カリキュラムタスク | ⭐⭐ |
| `tests` | テストコード | ⭐⭐ |
| `customization_exercises` | カスタマイズ練習問題 | ⭐⭐ |
| `exercise_submissions` | 練習問題提出 | ⭐⭐ |
| `project_simulations` | 実案件シミュレーション | ⭐⭐ |
| `project_submissions` | 案件提出 | ⭐⭐ |
| `usage_stats` | 使用統計 | ⭐⭐ |
| `feedback` | フィードバック | ⭐ |

---

## 主要テーブル詳細

### 1. `profiles` (ユーザープロフィール)

**Supabase Auth統合:**
- `auth.users` テーブルの拡張として機能
- `auth.users` に INSERT されると自動で `profiles` レコード作成

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    avatar_url TEXT,
    plan VARCHAR(50) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);
```

**ポイント:**
- `id` は `auth.users(id)` と同じ UUID
- サインアップ時に自動トリガーで作成
- メール・パスワードは `auth.users` が管理

---

### 2. `plan_limits` (プラン別制限)

各プランの機能制限を定義。

```sql
CREATE TABLE plan_limits (
    plan VARCHAR(50) PRIMARY KEY,
    daily_analyses_limit INTEGER NOT NULL,     -- -1 = 無制限
    monthly_analyses_limit INTEGER NOT NULL,
    test_generation_enabled BOOLEAN,
    customization_exercises_enabled BOOLEAN,
    project_simulations_enabled BOOLEAN,
    api_access_enabled BOOLEAN,
    api_requests_per_month INTEGER,
    max_file_size_mb INTEGER,
    priority_support BOOLEAN,
    mentoring_sessions_per_month INTEGER
);
```

**初期データ:**

| プラン | 日次制限 | テスト生成 | カスタマイズ | 案件シミュレ | API | メンタリング |
|--------|---------|-----------|-------------|------------|-----|-------------|
| free | 5回/日 | ❌ | ❌ | ❌ | ❌ | 0回 |
| standard | 無制限 | ✅ | ✅ | ❌ | ❌ | 0回 |
| professional | 無制限 | ✅ | ✅ | ✅ | ✅ (10K/月) | 2回/月 |
| enterprise | 無制限 | ✅ | ✅ | ✅ | 無制限 | 4回/月 |

---

### 3. `code_analyses` (コード解析履歴)

VSCode拡張機能から送信されたコードの解析履歴。

```sql
CREATE TABLE code_analyses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    code TEXT NOT NULL,
    code_hash VARCHAR(64) NOT NULL,           -- 重複検知用
    language VARCHAR(50) NOT NULL,
    file_path TEXT,
    file_name VARCHAR(255),
    is_claude_generated BOOLEAN DEFAULT FALSE, -- ⭐ Claude Code検知
    detection_method VARCHAR(50),              -- ⭐ 検知方法
    detected_at TIMESTAMP WITH TIME ZONE,      -- ⭐ 検知日時
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Claude Code 検知フラグ:**
- `is_claude_generated`: Claude Codeで生成されたか
- `detection_method`:
  - `timestamp` - タイムスタンプベース検知
  - `pattern` - パターン分析
  - `manual` - ユーザーが手動トリガー
  - `user_triggered` - ユーザーが明示的に「解析」実行

---

### 4. `explanations` (AI解説データ)

コード解析に対するAI生成解説。

```sql
CREATE TABLE explanations (
    id UUID PRIMARY KEY,
    code_analysis_id UUID REFERENCES code_analyses(id),
    level VARCHAR(50) NOT NULL,                -- beginner/intermediate/advanced
    content TEXT NOT NULL,                     -- 解説本文
    summary TEXT,                              -- 要約
    key_concepts JSONB,                        -- ["変数", "関数", "ループ"]
    complexity_score INTEGER,                  -- 1-10
    embedding vector(1536),                    -- ⭐ ベクトル埋め込み (類似検索用)
    ai_model VARCHAR(100),                     -- claude-3-5-sonnet, gpt-4
    generation_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**ベクトル検索:**
- `embedding` カラムに OpenAI embedding を保存
- 類似したコード解説を高速検索可能
- キャッシュ最適化に活用

---

### 5. `curriculum_days` + `curriculum_tasks` (7日間カリキュラム)

7日間学習プログラムのマスターデータ。

**curriculum_days (7レコード固定)**
```sql
CREATE TABLE curriculum_days (
    day INTEGER PRIMARY KEY CHECK (day >= 1 AND day <= 7),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    objectives JSONB NOT NULL,              -- ["目標1", "目標2", ...]
    estimated_time_minutes INTEGER DEFAULT 180,
    order_index INTEGER NOT NULL
);
```

**curriculum_tasks (各Dayに複数タスク)**
```sql
CREATE TABLE curriculum_tasks (
    id UUID PRIMARY KEY,
    day INTEGER REFERENCES curriculum_days(day),
    order_index INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,              -- video/reading/coding/quiz/exercise
    content JSONB,                          -- {url, duration} など
    estimated_minutes INTEGER DEFAULT 30,
    required BOOLEAN DEFAULT TRUE,
    exercise_id UUID REFERENCES customization_exercises(id)
);
```

**タイプ別content構造:**
- `video`: `{"url": "/videos/xxx.mp4", "duration": 20}`
- `reading`: `{"url": "/articles/xxx"}`
- `quiz`: `{"questions": 5, "passing_score": 80}`
- `exercise`: `{"instructions": "〜してください"}`

---

### 6. `learning_progress` (学習進捗)

ユーザーごとの7日間進捗管理。

```sql
CREATE TABLE learning_progress (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    day INTEGER CHECK (day >= 1 AND day <= 7),
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    tasks_completed JSONB DEFAULT '[]',     -- [task_id1, task_id2, ...]
    time_spent_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, day)
);
```

**使い方:**
1. ユーザーがDay1を開始 → `started_at` 記録
2. タスク完了 → `tasks_completed` に追加
3. 全タスク完了 → `completed = TRUE`, `completed_at` 記録

---

### 7. `usage_stats` (使用統計)

日次の利用状況集計。プラン制限チェックに使用。

```sql
CREATE TABLE usage_stats (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    date DATE NOT NULL,
    analyses_count INTEGER DEFAULT 0,       -- 解析回数
    tests_generated INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);
```

**制限チェック用VIEW:**
```sql
CREATE VIEW user_daily_usage AS
SELECT
    u.date,
    u.user_id,
    p.plan,
    u.analyses_count,
    pl.daily_analyses_limit,
    CASE
        WHEN pl.daily_analyses_limit = -1 THEN FALSE
        WHEN u.analyses_count >= pl.daily_analyses_limit THEN TRUE
        ELSE FALSE
    END as limit_reached
FROM usage_stats u
JOIN profiles p ON u.user_id = p.id
JOIN plan_limits pl ON p.plan = pl.plan
WHERE u.date = CURRENT_DATE;
```

---

## Row Level Security (RLS)

全テーブルで RLS を有効化。基本ポリシー:

### ユーザーデータ (自分のみアクセス)
```sql
-- 例: code_analyses
CREATE POLICY "Users can view own code analyses"
    ON code_analyses FOR SELECT
    USING (user_id = auth.uid());
```

### 公開マスターデータ (全員閲覧可)
```sql
-- 例: curriculum_days
CREATE POLICY "Anyone can view curriculum_days"
    ON curriculum_days FOR SELECT
    TO authenticated
    USING (true);
```

### Service Role (バックエンドAPI)
```sql
-- 全テーブルに適用
CREATE POLICY "Service role full access"
    ON {table_name} FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');
```

---

## インデックス戦略

### 頻繁に検索されるカラム
```sql
-- user_id (全ユーザーデータテーブル)
CREATE INDEX idx_code_analyses_user_id ON code_analyses(user_id);

-- created_at (時系列データ)
CREATE INDEX idx_code_analyses_created_at ON code_analyses(created_at DESC);

-- code_hash (重複検知)
CREATE INDEX idx_code_analyses_code_hash ON code_analyses(code_hash);
```

### ベクトル検索
```sql
-- pgvector IVFFlat index
CREATE INDEX idx_explanations_embedding
    ON explanations
    USING ivfflat (embedding vector_cosine_ops);
```

---

## トリガー

### 1. 新規ユーザー自動作成
```sql
-- auth.users INSERT → profiles INSERT
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
```

### 2. updated_at 自動更新
```sql
-- 全テーブルで UPDATE 時に updated_at を NOW() に
CREATE TRIGGER update_{table}_updated_at
    BEFORE UPDATE ON {table}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## マイグレーション実行手順

### ローカル環境
```bash
# Supabase起動
supabase start

# マイグレーション実行
supabase db push

# または手動で
psql $DATABASE_URL -f supabase/migrations/20250101000000_initial_schema.sql
psql $DATABASE_URL -f supabase/migrations/20250101000001_rls_policies.sql
psql $DATABASE_URL -f supabase/migrations/20250101000002_mvp_improvements.sql
```

### 本番環境
```bash
# Supabaseにログイン
supabase login

# プロジェクトとリンク
supabase link --project-ref your-project-ref

# マイグレーション実行
supabase db push
```

---

## 今後の拡張予定

### Phase 2 以降
- `explanation_ratings` - 解説評価
- `mentoring_sessions` - メンタリング予約
- `stripe_events` - Stripe Webhookログ
- `api_keys` - API利用者向けキー管理
- `team_members` - チームプラン用

---

## データ整合性チェック

### 推奨定期チェック
```sql
-- 孤立した code_analyses (explanations がない)
SELECT ca.id, ca.created_at
FROM code_analyses ca
LEFT JOIN explanations e ON ca.id = e.code_analysis_id
WHERE e.id IS NULL
AND ca.created_at > NOW() - INTERVAL '1 day';

-- プラン制限超過ユーザー
SELECT p.id, p.name, p.plan, u.analyses_count, pl.daily_analyses_limit
FROM profiles p
JOIN usage_stats u ON p.id = u.user_id
JOIN plan_limits pl ON p.plan = pl.plan
WHERE u.date = CURRENT_DATE
AND pl.daily_analyses_limit != -1
AND u.analyses_count > pl.daily_analyses_limit;
```

---

## パフォーマンス最適化

### 1. VACUUM定期実行
```sql
VACUUM ANALYZE code_analyses;
VACUUM ANALYZE explanations;
```

### 2. 古いデータのアーカイブ (3ヶ月以上前)
```sql
-- 別テーブルに移動 (本番運用時)
CREATE TABLE code_analyses_archive (LIKE code_analyses INCLUDING ALL);
```

### 3. 接続プーリング
- Supabase の Pooler を使用
- 最大接続数: 500 (Freeプラン: 60)
