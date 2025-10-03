-- ============================================
-- VIBECODING Complete Database Schema
-- Version: 1.0 Final
-- Date: 2025-01-02
-- ============================================

-- Clean slate (開発環境のみ!)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- PROFILES TABLE (auth.users の拡張)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    avatar_url TEXT,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'standard', 'professional', 'enterprise')),
    stripe_customer_id VARCHAR(255) UNIQUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_plan ON profiles(plan);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

COMMENT ON TABLE profiles IS 'ユーザープロフィール (auth.users拡張)';
COMMENT ON COLUMN profiles.preferences IS 'UI設定、通知設定などのJSON';

-- ============================================
-- PLAN LIMITS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS plan_limits (
    plan VARCHAR(50) PRIMARY KEY CHECK (plan IN ('free', 'standard', 'professional', 'enterprise')),
    daily_analyses_limit INTEGER NOT NULL,
    monthly_analyses_limit INTEGER NOT NULL,
    test_generation_enabled BOOLEAN DEFAULT FALSE,
    customization_exercises_enabled BOOLEAN DEFAULT FALSE,
    project_simulations_enabled BOOLEAN DEFAULT FALSE,
    api_access_enabled BOOLEAN DEFAULT FALSE,
    api_requests_per_month INTEGER DEFAULT 0,
    max_file_size_mb INTEGER DEFAULT 1,
    priority_support BOOLEAN DEFAULT FALSE,
    mentoring_sessions_per_month INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE plan_limits IS 'プラン別機能制限マスターデータ';
COMMENT ON COLUMN plan_limits.daily_analyses_limit IS '-1 = 無制限';

-- プラン制限データ投入
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
('free', 5, 150, FALSE, FALSE, FALSE, FALSE, 0, 1, FALSE, 0),
('standard', -1, -1, TRUE, TRUE, FALSE, FALSE, 0, 10, FALSE, 0),
('professional', -1, -1, TRUE, TRUE, TRUE, TRUE, 10000, 50, TRUE, 2),
('enterprise', -1, -1, TRUE, TRUE, TRUE, TRUE, -1, -1, TRUE, 4)
ON CONFLICT (plan) DO UPDATE SET
    daily_analyses_limit = EXCLUDED.daily_analyses_limit,
    monthly_analyses_limit = EXCLUDED.monthly_analyses_limit,
    test_generation_enabled = EXCLUDED.test_generation_enabled,
    customization_exercises_enabled = EXCLUDED.customization_exercises_enabled,
    project_simulations_enabled = EXCLUDED.project_simulations_enabled,
    api_access_enabled = EXCLUDED.api_access_enabled,
    api_requests_per_month = EXCLUDED.api_requests_per_month,
    max_file_size_mb = EXCLUDED.max_file_size_mb,
    priority_support = EXCLUDED.priority_support,
    mentoring_sessions_per_month = EXCLUDED.mentoring_sessions_per_month,
    updated_at = NOW();

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'standard', 'professional', 'enterprise')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

COMMENT ON TABLE subscriptions IS 'サブスクリプション管理';

-- ============================================
-- CODE ANALYSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS code_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    code_hash VARCHAR(64) NOT NULL,
    language VARCHAR(50) NOT NULL,
    file_path TEXT,
    file_name VARCHAR(255),
    is_claude_generated BOOLEAN DEFAULT FALSE,
    detection_method VARCHAR(50) CHECK (detection_method IN ('timestamp', 'pattern', 'manual', 'user_triggered')),
    detected_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_code_analyses_user_id ON code_analyses(user_id);
CREATE INDEX idx_code_analyses_code_hash ON code_analyses(code_hash);
CREATE INDEX idx_code_analyses_language ON code_analyses(language);
CREATE INDEX idx_code_analyses_created_at ON code_analyses(created_at DESC);
CREATE INDEX idx_code_analyses_is_claude_generated ON code_analyses(is_claude_generated);
CREATE INDEX idx_code_analyses_detected_at ON code_analyses(detected_at DESC) WHERE detected_at IS NOT NULL;

COMMENT ON TABLE code_analyses IS 'コード解析履歴';
COMMENT ON COLUMN code_analyses.code_hash IS 'SHA256ハッシュ (重複検知用)';
COMMENT ON COLUMN code_analyses.is_claude_generated IS 'Claude Codeで生成されたか';

-- ============================================
-- EXPLANATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_analysis_id UUID NOT NULL REFERENCES code_analyses(id) ON DELETE CASCADE,
    level VARCHAR(50) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    content TEXT NOT NULL,
    summary TEXT,
    key_concepts JSONB,
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    embedding vector(1536),
    ai_model VARCHAR(100),
    generation_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_explanations_code_analysis_id ON explanations(code_analysis_id);
CREATE INDEX idx_explanations_level ON explanations(level);
CREATE INDEX idx_explanations_embedding ON explanations USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE explanations IS 'AI生成解説データ';
COMMENT ON COLUMN explanations.embedding IS 'OpenAI embedding (類似検索用)';
COMMENT ON COLUMN explanations.ai_model IS '使用したAIモデル (例: claude-3-5-sonnet)';

-- ============================================
-- CURRICULUM TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS curriculum_days (
    day INTEGER PRIMARY KEY CHECK (day >= 1 AND day <= 7),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    objectives JSONB NOT NULL DEFAULT '[]'::JSONB,
    estimated_time_minutes INTEGER DEFAULT 180,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE curriculum_days IS '7日間カリキュラムマスターデータ';

CREATE TABLE IF NOT EXISTS curriculum_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day INTEGER NOT NULL REFERENCES curriculum_days(day) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'reading', 'coding', 'quiz', 'exercise')),
    content JSONB,
    estimated_minutes INTEGER DEFAULT 30,
    required BOOLEAN DEFAULT TRUE,
    exercise_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_day_order UNIQUE(day, order_index)
);

CREATE INDEX idx_curriculum_tasks_day ON curriculum_tasks(day);
CREATE INDEX idx_curriculum_tasks_type ON curriculum_tasks(type);

COMMENT ON TABLE curriculum_tasks IS '7日間カリキュラムのタスク';
COMMENT ON COLUMN curriculum_tasks.content IS 'タイプ別データ (URL, 問題文など)';

-- カリキュラムデータ投入
INSERT INTO curriculum_days (day, title, description, objectives, estimated_time_minutes, order_index) VALUES
(1, 'Day 1: AIコードの基礎理解', 'AIが生成したコードの基本構造を理解し、変数・関数・条件分岐を読み解く力を養います。',
    '["変数の役割を理解する", "関数の仕組みを理解する", "if文による条件分岐を理解する", "AIコードを読んで説明できる"]'::JSONB, 180, 1),
(2, 'Day 2: コード構造の読解', 'より複雑なコード構造を読み解き、ループ・配列・オブジェクトの操作を習得します。',
    '["ループ処理を理解する", "配列操作を理解する", "オブジェクトの扱いを理解する", "デバッグの基礎を学ぶ"]'::JSONB, 180, 2),
(3, 'Day 3: エラー解決とデバッグ', 'エラーメッセージの読み方、デバッグ手法、問題解決のアプローチを学びます。',
    '["エラーメッセージを読める", "console.logでデバッグできる", "よくあるエラーパターンを知る", "自力で問題解決できる"]'::JSONB, 180, 3),
(4, 'Day 4: カスタマイズの基礎', '既存コードに小さな変更を加え、カスタマイズの基礎を習得します。',
    '["関数の引数を変更できる", "テキストやスタイルを変更できる", "簡単な機能を追加できる", "変更の影響範囲を理解する"]'::JSONB, 180, 4),
(5, 'Day 5: 実践的カスタマイズ', '顧客要望に応じた実践的なカスタマイズスキルを磨きます。',
    '["要件を理解してコード変更できる", "複数箇所の変更を調整できる", "動作確認とテストができる", "変更内容を説明できる"]'::JSONB, 180, 5),
(6, 'Day 6: 実案件シミュレーション', '実際の案件を想定し、要件定義から納品までの流れを体験します。',
    '["顧客要件を理解する", "工数と価格を見積もる", "要件通りに実装する", "ドキュメントを作成する"]'::JSONB, 180, 6),
(7, 'Day 7: 総合演習と案件獲得準備', '総合演習でスキルを確認し、実案件獲得のための準備を整えます。',
    '["模擬案件を完遂する", "ポートフォリオを作成する", "営業準備を整える", "初案件獲得の計画を立てる"]'::JSONB, 180, 7)
ON CONFLICT (day) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    objectives = EXCLUDED.objectives,
    estimated_time_minutes = EXCLUDED.estimated_time_minutes,
    order_index = EXCLUDED.order_index,
    updated_at = NOW();

-- Day 1 タスク例
INSERT INTO curriculum_tasks (day, order_index, title, description, type, content, estimated_minutes, required) VALUES
(1, 1, 'ウェルカム動画', 'VIBECODINGの使い方と7日間の学習計画を理解します。', 'video',
    '{"url": "/videos/welcome.mp4", "duration": 5}'::JSONB, 5, TRUE),
(1, 2, 'AIコード生成とは', 'Claude CodeやChatGPTによるコード生成の仕組みを学びます。', 'reading',
    '{"url": "/articles/ai-code-generation"}'::JSONB, 15, TRUE),
(1, 3, '変数と関数の基礎', '変数・関数の役割を解説動画で学習します。', 'video',
    '{"url": "/videos/day1-basics.mp4", "duration": 20}'::JSONB, 20, TRUE)
ON CONFLICT (day, order_index) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    content = EXCLUDED.content,
    estimated_minutes = EXCLUDED.estimated_minutes,
    required = EXCLUDED.required,
    updated_at = NOW();

-- ============================================
-- LEARNING PROGRESS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day INTEGER NOT NULL CHECK (day >= 1 AND day <= 7),
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    tasks_completed JSONB DEFAULT '[]'::JSONB,
    time_spent_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_day UNIQUE(user_id, day)
);

CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_day ON learning_progress(day);
CREATE INDEX idx_learning_progress_completed ON learning_progress(completed);

COMMENT ON TABLE learning_progress IS 'ユーザーの7日間学習進捗';

-- ============================================
-- TESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_analysis_id UUID NOT NULL REFERENCES code_analyses(id) ON DELETE CASCADE,
    test_code TEXT NOT NULL,
    framework VARCHAR(50),
    passing BOOLEAN,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tests_code_analysis_id ON tests(code_analysis_id);

COMMENT ON TABLE tests IS '自動生成テストコード';

-- ============================================
-- CUSTOMIZATION EXERCISES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS customization_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(50) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(100),
    base_code TEXT NOT NULL,
    requirements JSONB NOT NULL,
    hints JSONB,
    expected_output TEXT,
    test_cases JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customization_exercises_difficulty ON customization_exercises(difficulty);
CREATE INDEX idx_customization_exercises_category ON customization_exercises(category);

COMMENT ON TABLE customization_exercises IS 'カスタマイズ練習問題マスター';

-- サンプル演習データ
INSERT INTO customization_exercises (title, description, difficulty, category, base_code, requirements, hints, expected_output, test_cases) VALUES
('関数に引数を追加する', 'greet関数にname引数を追加し、「こんにちは、{name}さん!」と表示するように修正してください。',
    'beginner', 'basic',
    'function greet() {\n  console.log("こんにちは!");\n}',
    '["name引数を追加", "引数を使って挨拶メッセージを生成", "console.logで出力"]'::JSONB,
    '["関数の引数は()の中に書きます", "テンプレートリテラル `${変数}` が便利です"]'::JSONB,
    'こんにちは、太郎さん!',
    '[{"input": "太郎", "expected": "こんにちは、太郎さん!"}, {"input": "花子", "expected": "こんにちは、花子さん!"}]'::JSONB),
('配列の合計を計算する', 'numbers配列の全要素の合計を計算する関数sumを作成してください。',
    'beginner', 'basic',
    'const numbers = [1, 2, 3, 4, 5];\n// ここに関数を実装',
    '["sum関数を作成", "配列をループで処理", "合計を返す"]'::JSONB,
    '["forループまたはreduceメソッドを使います", "変数で合計を保持します"]'::JSONB,
    '15',
    '[{"input": [1, 2, 3, 4, 5], "expected": 15}, {"input": [10, 20, 30], "expected": 60}]'::JSONB),
('ボタンクリックで色を変える', 'ボタンをクリックすると背景色が変わるようにJavaScriptを追加してください。',
    'intermediate', 'web',
    '<button id="colorBtn">色を変える</button>\n<script>\n// ここにコードを追加\n</script>',
    '["ボタン要素を取得", "クリックイベントリスナーを追加", "背景色をランダムに変更"]'::JSONB,
    '["document.getElementByIdでボタン取得", "Math.random()で色を生成"]'::JSONB,
    'クリックで背景色が変わる',
    '[{"action": "click", "expected": "background color changes"}]'::JSONB)
ON CONFLICT DO NOTHING;

-- ============================================
-- EXERCISE SUBMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS exercise_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES customization_exercises(id) ON DELETE CASCADE,
    submitted_code TEXT NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    passed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    ai_evaluation JSONB,
    attempt_number INTEGER DEFAULT 1,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercise_submissions_user_id ON exercise_submissions(user_id);
CREATE INDEX idx_exercise_submissions_exercise_id ON exercise_submissions(exercise_id);
CREATE INDEX idx_exercise_submissions_submitted_at ON exercise_submissions(submitted_at DESC);

COMMENT ON TABLE exercise_submissions IS 'ユーザーの演習提出履歴';

-- ============================================
-- PROJECT SIMULATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS project_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(50) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(100),
    requirements TEXT NOT NULL,
    client_info JSONB,
    budget_range JSONB,
    timeline_days INTEGER,
    reference_code TEXT,
    evaluation_criteria JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_simulations_difficulty ON project_simulations(difficulty);
CREATE INDEX idx_project_simulations_category ON project_simulations(category);

COMMENT ON TABLE project_simulations IS '実案件シミュレーションマスター';

-- ============================================
-- PROJECT SUBMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS project_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES project_simulations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    documentation TEXT,
    estimated_hours DECIMAL(5, 2),
    estimated_price DECIMAL(10, 2),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    ai_evaluation JSONB,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_submissions_user_id ON project_submissions(user_id);
CREATE INDEX idx_project_submissions_project_id ON project_submissions(project_id);

COMMENT ON TABLE project_submissions IS '案件シミュレーション提出履歴';

-- ============================================
-- USAGE STATS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    analyses_count INTEGER DEFAULT 0,
    tests_generated INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

CREATE INDEX idx_usage_stats_user_id ON usage_stats(user_id);
CREATE INDEX idx_usage_stats_date ON usage_stats(date DESC);

COMMENT ON TABLE usage_stats IS '日次使用統計';

-- ============================================
-- FEEDBACK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type VARCHAR(50) CHECK (type IN ('bug', 'feature', 'general', 'explanation_quality')),
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    metadata JSONB,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_status ON feedback(status);

COMMENT ON TABLE feedback IS 'ユーザーフィードバック';

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at トリガー適用
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_progress_updated_at ON learning_progress;
CREATE TRIGGER update_learning_progress_updated_at
    BEFORE UPDATE ON learning_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_curriculum_days_updated_at ON curriculum_days;
CREATE TRIGGER update_curriculum_days_updated_at
    BEFORE UPDATE ON curriculum_days
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_curriculum_tasks_updated_at ON curriculum_tasks;
CREATE TRIGGER update_curriculum_tasks_updated_at
    BEFORE UPDATE ON curriculum_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customization_exercises_updated_at ON customization_exercises;
CREATE TRIGGER update_customization_exercises_updated_at
    BEFORE UPDATE ON customization_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_simulations_updated_at ON project_simulations;
CREATE TRIGGER update_project_simulations_updated_at
    BEFORE UPDATE ON project_simulations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_stats_updated_at ON usage_stats;
CREATE TRIGGER update_usage_stats_updated_at
    BEFORE UPDATE ON usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_limits_updated_at ON plan_limits;
CREATE TRIGGER update_plan_limits_updated_at
    BEFORE UPDATE ON plan_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTH.USERS 連携トリガー
-- ============================================

-- 新規ユーザー作成時に profiles レコードを自動作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_tasks ENABLE ROW LEVEL SECURITY;

-- Profiles ポリシー
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;
CREATE POLICY "Service role full access to profiles" ON profiles FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Subscriptions ポリシー
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to subscriptions" ON subscriptions;
CREATE POLICY "Service role full access to subscriptions" ON subscriptions FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Code Analyses ポリシー
DROP POLICY IF EXISTS "Users can view own code analyses" ON code_analyses;
CREATE POLICY "Users can view own code analyses" ON code_analyses FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own code analyses" ON code_analyses;
CREATE POLICY "Users can insert own code analyses" ON code_analyses FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own code analyses" ON code_analyses;
CREATE POLICY "Users can delete own code analyses" ON code_analyses FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to code_analyses" ON code_analyses;
CREATE POLICY "Service role full access to code_analyses" ON code_analyses FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Explanations ポリシー
DROP POLICY IF EXISTS "Users can view own explanations" ON explanations;
CREATE POLICY "Users can view own explanations" ON explanations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM code_analyses
        WHERE code_analyses.id = explanations.code_analysis_id
        AND code_analyses.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Service role full access to explanations" ON explanations;
CREATE POLICY "Service role full access to explanations" ON explanations FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Learning Progress ポリシー
DROP POLICY IF EXISTS "Users can view own learning progress" ON learning_progress;
CREATE POLICY "Users can view own learning progress" ON learning_progress FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own learning progress" ON learning_progress;
CREATE POLICY "Users can insert own learning progress" ON learning_progress FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own learning progress" ON learning_progress;
CREATE POLICY "Users can update own learning progress" ON learning_progress FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to learning_progress" ON learning_progress;
CREATE POLICY "Service role full access to learning_progress" ON learning_progress FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Tests ポリシー
DROP POLICY IF EXISTS "Users can view own tests" ON tests;
CREATE POLICY "Users can view own tests" ON tests FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM code_analyses
        WHERE code_analyses.id = tests.code_analysis_id
        AND code_analyses.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Service role full access to tests" ON tests;
CREATE POLICY "Service role full access to tests" ON tests FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Customization Exercises ポリシー (公開マスター)
DROP POLICY IF EXISTS "Anyone can view exercises" ON customization_exercises;
CREATE POLICY "Anyone can view exercises" ON customization_exercises FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full access to customization_exercises" ON customization_exercises;
CREATE POLICY "Service role full access to customization_exercises" ON customization_exercises FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Exercise Submissions ポリシー
DROP POLICY IF EXISTS "Users can view own exercise submissions" ON exercise_submissions;
CREATE POLICY "Users can view own exercise submissions" ON exercise_submissions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own exercise submissions" ON exercise_submissions;
CREATE POLICY "Users can insert own exercise submissions" ON exercise_submissions FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to exercise_submissions" ON exercise_submissions;
CREATE POLICY "Service role full access to exercise_submissions" ON exercise_submissions FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Project Simulations ポリシー (公開マスター)
DROP POLICY IF EXISTS "Anyone can view project simulations" ON project_simulations;
CREATE POLICY "Anyone can view project simulations" ON project_simulations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full access to project_simulations" ON project_simulations;
CREATE POLICY "Service role full access to project_simulations" ON project_simulations FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Project Submissions ポリシー
DROP POLICY IF EXISTS "Users can view own project submissions" ON project_submissions;
CREATE POLICY "Users can view own project submissions" ON project_submissions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own project submissions" ON project_submissions;
CREATE POLICY "Users can insert own project submissions" ON project_submissions FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to project_submissions" ON project_submissions;
CREATE POLICY "Service role full access to project_submissions" ON project_submissions FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Usage Stats ポリシー
DROP POLICY IF EXISTS "Users can view own usage stats" ON usage_stats;
CREATE POLICY "Users can view own usage stats" ON usage_stats FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to usage_stats" ON usage_stats;
CREATE POLICY "Service role full access to usage_stats" ON usage_stats FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Feedback ポリシー
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
CREATE POLICY "Users can view own feedback" ON feedback FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
CREATE POLICY "Users can insert feedback" ON feedback FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to feedback" ON feedback;
CREATE POLICY "Service role full access to feedback" ON feedback FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Plan Limits ポリシー (全員閲覧可)
DROP POLICY IF EXISTS "Anyone can view plan limits" ON plan_limits;
CREATE POLICY "Anyone can view plan limits" ON plan_limits FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full access to plan_limits" ON plan_limits;
CREATE POLICY "Service role full access to plan_limits" ON plan_limits FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Curriculum ポリシー (全員閲覧可)
DROP POLICY IF EXISTS "Anyone can view curriculum_days" ON curriculum_days;
CREATE POLICY "Anyone can view curriculum_days" ON curriculum_days FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full access to curriculum_days" ON curriculum_days;
CREATE POLICY "Service role full access to curriculum_days" ON curriculum_days FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Anyone can view curriculum_tasks" ON curriculum_tasks;
CREATE POLICY "Anyone can view curriculum_tasks" ON curriculum_tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full access to curriculum_tasks" ON curriculum_tasks;
CREATE POLICY "Service role full access to curriculum_tasks" ON curriculum_tasks FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- VIEWS
-- ============================================

-- 日次使用量チェック用VIEW
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

COMMENT ON VIEW user_daily_usage IS '本日の使用量と制限チェック';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- 複合インデックス (よく使われるクエリパターン用)
CREATE INDEX IF NOT EXISTS idx_code_analyses_user_created ON code_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_explanations_analysis_level ON explanations(code_analysis_id, level);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_day ON learning_progress(user_id, day);

-- ============================================
-- INITIAL ADMIN USER (オプション)
-- ============================================

-- 開発環境用: 管理者ユーザー作成
-- 本番環境では削除すること!
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
-- VALUES (
--     uuid_generate_v4(),
--     'admin@vibecoding.com',
--     crypt('password123', gen_salt('bf')),
--     NOW(),
--     '{"name": "Admin User"}'::JSONB
-- ) ON CONFLICT DO NOTHING;

-- ============================================
-- COMPLETION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VIBECODING Database Schema Installation Complete!';
    RAISE NOTICE 'Total Tables: 15';
    RAISE NOTICE 'Total Views: 1';
    RAISE NOTICE 'RLS: Enabled on all tables';
    RAISE NOTICE 'Triggers: Auto-created profiles, updated_at';
    RAISE NOTICE '========================================';
END $$;
