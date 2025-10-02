-- ============================================
-- VIBECODING Database Schema
-- Version: 1.0
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for AI similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'standard', 'professional', 'enterprise')),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Index for email lookup
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'standard', 'professional', 'enterprise')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- ============================================
-- CODE_ANALYSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS code_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    code_hash VARCHAR(64) NOT NULL, -- SHA256 hash for deduplication
    language VARCHAR(50) NOT NULL,
    file_path TEXT,
    file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_code_analyses_user_id ON code_analyses(user_id);
CREATE INDEX idx_code_analyses_code_hash ON code_analyses(code_hash);
CREATE INDEX idx_code_analyses_language ON code_analyses(language);
CREATE INDEX idx_code_analyses_created_at ON code_analyses(created_at DESC);

-- ============================================
-- EXPLANATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_analysis_id UUID REFERENCES code_analyses(id) ON DELETE CASCADE,
    level VARCHAR(50) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    content TEXT NOT NULL,
    summary TEXT,
    key_concepts JSONB, -- Array of key concepts
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    embedding vector(1536), -- OpenAI embedding for similarity search
    ai_model VARCHAR(100), -- e.g., 'claude-3-5-sonnet', 'gpt-4'
    generation_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_explanations_code_analysis_id ON explanations(code_analysis_id);
CREATE INDEX idx_explanations_level ON explanations(level);
-- Vector similarity search index
CREATE INDEX idx_explanations_embedding ON explanations USING ivfflat (embedding vector_cosine_ops);

-- ============================================
-- LEARNING_PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day INTEGER NOT NULL CHECK (day >= 1 AND day <= 7),
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    tasks_completed JSONB DEFAULT '[]', -- Array of completed task IDs
    time_spent_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, day)
);

CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_day ON learning_progress(day);

-- ============================================
-- TESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_analysis_id UUID REFERENCES code_analyses(id) ON DELETE CASCADE,
    test_code TEXT NOT NULL,
    framework VARCHAR(50), -- 'jest', 'vitest', 'pytest', etc.
    passing BOOLEAN,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tests_code_analysis_id ON tests(code_analysis_id);

-- ============================================
-- CUSTOMIZATION_EXERCISES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customization_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(50) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(100), -- 'web', 'api', 'scraping', etc.
    base_code TEXT NOT NULL,
    requirements JSONB NOT NULL, -- Array of requirement objects
    hints JSONB, -- Array of hints
    expected_output TEXT,
    test_cases JSONB, -- Array of test case objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customization_exercises_difficulty ON customization_exercises(difficulty);
CREATE INDEX idx_customization_exercises_category ON customization_exercises(category);

-- ============================================
-- EXERCISE_SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES customization_exercises(id) ON DELETE CASCADE,
    submitted_code TEXT NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    passed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    ai_evaluation JSONB, -- Detailed AI evaluation
    attempt_number INTEGER DEFAULT 1,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exercise_submissions_user_id ON exercise_submissions(user_id);
CREATE INDEX idx_exercise_submissions_exercise_id ON exercise_submissions(exercise_id);
CREATE INDEX idx_exercise_submissions_submitted_at ON exercise_submissions(submitted_at DESC);

-- ============================================
-- PROJECT_SIMULATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(50) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(100),
    requirements TEXT NOT NULL,
    client_info JSONB, -- Simulated client information
    budget_range JSONB, -- {min: number, max: number}
    timeline_days INTEGER,
    reference_code TEXT,
    evaluation_criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_simulations_difficulty ON project_simulations(difficulty);
CREATE INDEX idx_project_simulations_category ON project_simulations(category);

-- ============================================
-- PROJECT_SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES project_simulations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    documentation TEXT,
    estimated_hours DECIMAL(5, 2),
    estimated_price DECIMAL(10, 2),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    ai_evaluation JSONB,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_submissions_user_id ON project_submissions(user_id);
CREATE INDEX idx_project_submissions_project_id ON project_submissions(project_id);

-- ============================================
-- USAGE_STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    analyses_count INTEGER DEFAULT 0,
    tests_generated INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_usage_stats_user_id ON usage_stats(user_id);
CREATE INDEX idx_usage_stats_date ON usage_stats(date DESC);

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) CHECK (type IN ('bug', 'feature', 'general', 'explanation_quality')),
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    metadata JSONB, -- Additional context
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_status ON feedback(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customization_exercises_updated_at BEFORE UPDATE ON customization_exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_simulations_updated_at BEFORE UPDATE ON project_simulations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_stats_updated_at BEFORE UPDATE ON usage_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Sample customization exercises (first 3)
INSERT INTO customization_exercises (title, description, difficulty, category, base_code, requirements, hints, expected_output, test_cases) VALUES
(
    '関数に引数を追加する',
    'greet関数にname引数を追加し、「こんにちは、{name}さん!」と表示するように修正してください。',
    'beginner',
    'basic',
    'function greet() {\n  console.log("こんにちは!");\n}',
    '["name引数を追加", "引数を使って挨拶メッセージを生成", "console.logで出力"]',
    '["関数の引数は()の中に書きます", "テンプレートリテラル `${変数}` が便利です"]',
    'こんにちは、太郎さん!',
    '[{"input": "太郎", "expected": "こんにちは、太郎さん!"}, {"input": "花子", "expected": "こんにちは、花子さん!"}]'
),
(
    '配列の合計を計算する',
    'numbers配列の全要素の合計を計算する関数sumを作成してください。',
    'beginner',
    'basic',
    'const numbers = [1, 2, 3, 4, 5];\n// ここに関数を実装',
    '["sum関数を作成", "配列をループで処理", "合計を返す"]',
    '["forループまたはreduceメソッドを使います", "変数で合計を保持します"]',
    '15',
    '[{"input": [1, 2, 3, 4, 5], "expected": 15}, {"input": [10, 20, 30], "expected": 60}]'
),
(
    'ボタンクリックで色を変える',
    'ボタンをクリックすると背景色が変わるようにJavaScriptを追加してください。',
    'intermediate',
    'web',
    '<button id="colorBtn">色を変える</button>\n<script>\n// ここにコードを追加\n</script>',
    '["ボタン要素を取得", "クリックイベントリスナーを追加", "背景色をランダムに変更"]',
    '["document.getElementByIdでボタン取得", "Math.random()で色を生成"]',
    'クリックで背景色が変わる',
    '[{"action": "click", "expected": "background color changes"}]'
);

COMMIT;
