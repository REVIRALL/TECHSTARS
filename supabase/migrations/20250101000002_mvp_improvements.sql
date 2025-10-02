-- ============================================
-- MVP Critical Improvements
-- Version: 1.1 - Phase 1 必須修正
-- ============================================

-- ============================================
-- 1. Supabase Auth 統合
-- ============================================

-- 既存の users テーブルを削除して profiles に置き換え
DROP TABLE IF EXISTS users CASCADE;

-- Profiles テーブル (Supabase auth.users を拡張)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    avatar_url TEXT,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'standard', 'professional', 'enterprise')),
    stripe_customer_id VARCHAR(255),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}', -- UI設定、通知設定など
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_profiles_plan ON profiles(plan);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Updated_at trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auth.users 作成時に自動で profiles レコード作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, name, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. 既存テーブルの user_id を profiles.id に更新
-- ============================================

-- Subscriptions
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Code Analyses
ALTER TABLE code_analyses DROP CONSTRAINT IF EXISTS code_analyses_user_id_fkey;
ALTER TABLE code_analyses ADD CONSTRAINT code_analyses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Learning Progress
ALTER TABLE learning_progress DROP CONSTRAINT IF EXISTS learning_progress_user_id_fkey;
ALTER TABLE learning_progress ADD CONSTRAINT learning_progress_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Exercise Submissions
ALTER TABLE exercise_submissions DROP CONSTRAINT IF EXISTS exercise_submissions_user_id_fkey;
ALTER TABLE exercise_submissions ADD CONSTRAINT exercise_submissions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Project Submissions
ALTER TABLE project_submissions DROP CONSTRAINT IF EXISTS project_submissions_user_id_fkey;
ALTER TABLE project_submissions ADD CONSTRAINT project_submissions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Usage Stats
ALTER TABLE usage_stats DROP CONSTRAINT IF EXISTS usage_stats_user_id_fkey;
ALTER TABLE usage_stats ADD CONSTRAINT usage_stats_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Feedback
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;
ALTER TABLE feedback ADD CONSTRAINT feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================
-- 3. Claude Code 検知情報追加
-- ============================================

ALTER TABLE code_analyses ADD COLUMN is_claude_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE code_analyses ADD COLUMN detection_method VARCHAR(50)
    CHECK (detection_method IN ('timestamp', 'pattern', 'manual', 'user_triggered'));
ALTER TABLE code_analyses ADD COLUMN detected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE code_analyses ADD COLUMN metadata JSONB DEFAULT '{}'; -- 追加メタデータ

CREATE INDEX idx_code_analyses_is_claude_generated ON code_analyses(is_claude_generated);
CREATE INDEX idx_code_analyses_detected_at ON code_analyses(detected_at DESC);

-- ============================================
-- 4. プラン別制限テーブル
-- ============================================

CREATE TABLE plan_limits (
    plan VARCHAR(50) PRIMARY KEY CHECK (plan IN ('free', 'standard', 'professional', 'enterprise')),
    daily_analyses_limit INTEGER NOT NULL, -- -1 = unlimited
    monthly_analyses_limit INTEGER NOT NULL,
    test_generation_enabled BOOLEAN DEFAULT FALSE,
    customization_exercises_enabled BOOLEAN DEFAULT FALSE,
    project_simulations_enabled BOOLEAN DEFAULT FALSE,
    api_access_enabled BOOLEAN DEFAULT FALSE,
    api_requests_per_month INTEGER DEFAULT 0,
    max_file_size_mb INTEGER DEFAULT 1,
    priority_support BOOLEAN DEFAULT FALSE,
    mentoring_sessions_per_month INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初期プランデータ
INSERT INTO plan_limits (
    plan,
    daily_analyses_limit,
    monthly_analyses_limit,
    test_generation_enabled,
    customization_exercises_enabled,
    project_simulations_enabled,
    api_access_enabled,
    api_requests_per_month,
    max_file_size_mb,
    priority_support,
    mentoring_sessions_per_month
) VALUES
(
    'free',
    5,      -- 5回/日
    150,    -- 150回/月
    FALSE,  -- テスト生成なし
    FALSE,  -- カスタマイズ練習なし
    FALSE,  -- 実案件シミュレーターなし
    FALSE,  -- API利用なし
    0,
    1,      -- 1MB制限
    FALSE,  -- サポートなし
    0       -- メンタリングなし
),
(
    'standard',
    -1,     -- 無制限
    -1,     -- 無制限
    TRUE,   -- テスト生成あり
    TRUE,   -- カスタマイズ練習あり
    FALSE,  -- 実案件シミュレーターなし
    FALSE,  -- API利用なし
    0,
    10,     -- 10MB制限
    FALSE,  -- メールサポート
    0       -- メンタリングなし
),
(
    'professional',
    -1,     -- 無制限
    -1,     -- 無制限
    TRUE,   -- テスト生成あり
    TRUE,   -- カスタマイズ練習あり
    TRUE,   -- 実案件シミュレーターあり
    TRUE,   -- API利用あり
    10000,  -- 10,000 requests/月
    50,     -- 50MB制限
    TRUE,   -- 優先サポート
    2       -- メンタリング月2回
),
(
    'enterprise',
    -1,     -- 無制限
    -1,     -- 無制限
    TRUE,   -- 全機能有効
    TRUE,
    TRUE,
    TRUE,
    -1,     -- 無制限
    -1,     -- 無制限
    TRUE,   -- 24時間サポート
    4       -- メンタリング月4回
);

CREATE TRIGGER update_plan_limits_updated_at
    BEFORE UPDATE ON plan_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. カリキュラムマスターデータ
-- ============================================

CREATE TABLE curriculum_days (
    day INTEGER PRIMARY KEY CHECK (day >= 1 AND day <= 7),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    objectives JSONB NOT NULL, -- ["目標1", "目標2"]
    estimated_time_minutes INTEGER DEFAULT 180, -- 3時間/日想定
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE curriculum_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day INTEGER NOT NULL REFERENCES curriculum_days(day) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'reading', 'coding', 'quiz', 'exercise')),
    content JSONB, -- 動画URL、記事URL、コード課題など
    estimated_minutes INTEGER DEFAULT 30,
    required BOOLEAN DEFAULT TRUE,
    exercise_id UUID REFERENCES customization_exercises(id), -- type='exercise' の場合
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(day, order_index)
);

CREATE INDEX idx_curriculum_tasks_day ON curriculum_tasks(day);
CREATE INDEX idx_curriculum_tasks_type ON curriculum_tasks(type);

CREATE TRIGGER update_curriculum_days_updated_at
    BEFORE UPDATE ON curriculum_days
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculum_tasks_updated_at
    BEFORE UPDATE ON curriculum_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. カリキュラム初期データ (7日間)
-- ============================================

INSERT INTO curriculum_days (day, title, description, objectives, estimated_time_minutes, order_index) VALUES
(1, 'Day 1: AIコードの基礎理解', 'AIが生成したコードの基本構造を理解し、変数・関数・条件分岐を読み解く力を養います。',
    '["変数の役割を理解する", "関数の仕組みを理解する", "if文による条件分岐を理解する", "AIコードを読んで説明できる"]',
    180, 1),
(2, 'Day 2: コード構造の読解', 'より複雑なコード構造を読み解き、ループ・配列・オブジェクトの操作を習得します。',
    '["ループ処理を理解する", "配列操作を理解する", "オブジェクトの扱いを理解する", "デバッグの基礎を学ぶ"]',
    180, 2),
(3, 'Day 3: エラー解決とデバッグ', 'エラーメッセージの読み方、デバッグ手法、問題解決のアプローチを学びます。',
    '["エラーメッセージを読める", "console.logでデバッグできる", "よくあるエラーパターンを知る", "自力で問題解決できる"]',
    180, 3),
(4, 'Day 4: カスタマイズの基礎', '既存コードに小さな変更を加え、カスタマイズの基礎を習得します。',
    '["関数の引数を変更できる", "テキストやスタイルを変更できる", "簡単な機能を追加できる", "変更の影響範囲を理解する"]',
    180, 4),
(5, 'Day 5: 実践的カスタマイズ', '顧客要望に応じた実践的なカスタマイズスキルを磨きます。',
    '["要件を理解してコード変更できる", "複数箇所の変更を調整できる", "動作確認とテストができる", "変更内容を説明できる"]',
    180, 5),
(6, 'Day 6: 実案件シミュレーション', '実際の案件を想定し、要件定義から納品までの流れを体験します。',
    '["顧客要件を理解する", "工数と価格を見積もる", "要件通りに実装する", "ドキュメントを作成する"]',
    180, 6),
(7, 'Day 7: 総合演習と案件獲得準備', '総合演習でスキルを確認し、実案件獲得のための準備を整えます。',
    '["模擬案件を完遂する", "ポートフォリオを作成する", "営業準備を整える", "初案件獲得の計画を立てる"]',
    180, 7);

-- Day 1 タスク
INSERT INTO curriculum_tasks (day, order_index, title, description, type, content, estimated_minutes, required) VALUES
(1, 1, 'ウェルカム動画', 'VIBECODINGの使い方と7日間の学習計画を理解します。', 'video',
    '{"url": "/videos/welcome.mp4", "duration": 5}', 5, TRUE),
(1, 2, 'AIコード生成とは', 'Claude CodeやChatGPTによるコード生成の仕組みを学びます。', 'reading',
    '{"url": "/articles/ai-code-generation"}', 15, TRUE),
(1, 3, '変数と関数の基礎', '変数・関数の役割を解説動画で学習します。', 'video',
    '{"url": "/videos/day1-basics.mp4", "duration": 20}', 20, TRUE),
(1, 4, '演習: 関数に引数を追加する', '実際にコードを編集して、引数の使い方を習得します。', 'exercise',
    '{"instructions": "greet関数にname引数を追加してください"}', 30, TRUE),
(1, 5, 'if文による条件分岐', '条件分岐の仕組みと実例を学びます。', 'video',
    '{"url": "/videos/day1-if-statement.mp4", "duration": 15}', 15, TRUE),
(1, 6, '演習: 条件分岐を追加', '年齢に応じたメッセージを表示する機能を追加します。', 'exercise',
    '{"instructions": "年齢が18歳以上かどうかで表示を変える"}', 30, TRUE),
(1, 7, 'Day 1 確認クイズ', '本日学んだ内容の理解度をチェックします。', 'quiz',
    '{"questions": 5, "passing_score": 80}', 15, TRUE),
(1, 8, 'VSCode拡張機能の使い方', 'VIBECODING拡張機能の基本操作を習得します。', 'video',
    '{"url": "/videos/vscode-extension.mp4", "duration": 10}', 10, FALSE);

-- Day 2-7 はMVP後に追加予定 (タスク構造は同様)

-- ============================================
-- 7. 使用量チェック用ビュー (プラン制限確認用)
-- ============================================

CREATE OR REPLACE VIEW user_daily_usage AS
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

-- ============================================
-- 8. RLS ポリシー更新 (profiles 対応)
-- ============================================

-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Service role full access to profiles"
    ON profiles FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Plan Limits (全員が閲覧可能)
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan limits"
    ON plan_limits FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role full access to plan_limits"
    ON plan_limits FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Curriculum (全員が閲覧可能)
ALTER TABLE curriculum_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view curriculum_days"
    ON curriculum_days FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anyone can view curriculum_tasks"
    ON curriculum_tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role full access to curriculum_days"
    ON curriculum_days FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to curriculum_tasks"
    ON curriculum_tasks FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

COMMIT;
