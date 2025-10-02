-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
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

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Service role can do anything (for backend operations)
CREATE POLICY "Service role full access to users"
    ON users FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT
    USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to subscriptions"
    ON subscriptions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- CODE_ANALYSES TABLE POLICIES
-- ============================================

-- Users can view their own code analyses
CREATE POLICY "Users can view own code analyses"
    ON code_analyses FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own code analyses
CREATE POLICY "Users can insert own code analyses"
    ON code_analyses FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own code analyses
CREATE POLICY "Users can delete own code analyses"
    ON code_analyses FOR DELETE
    USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to code_analyses"
    ON code_analyses FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- EXPLANATIONS TABLE POLICIES
-- ============================================

-- Users can view explanations for their own code analyses
CREATE POLICY "Users can view own explanations"
    ON explanations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM code_analyses
            WHERE code_analyses.id = explanations.code_analysis_id
            AND code_analyses.user_id = auth.uid()
        )
    );

-- Service role full access
CREATE POLICY "Service role full access to explanations"
    ON explanations FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- LEARNING_PROGRESS TABLE POLICIES
-- ============================================

-- Users can view their own progress
CREATE POLICY "Users can view own learning progress"
    ON learning_progress FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "Users can insert own learning progress"
    ON learning_progress FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "Users can update own learning progress"
    ON learning_progress FOR UPDATE
    USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to learning_progress"
    ON learning_progress FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TESTS TABLE POLICIES
-- ============================================

-- Users can view tests for their own code analyses
CREATE POLICY "Users can view own tests"
    ON tests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM code_analyses
            WHERE code_analyses.id = tests.code_analysis_id
            AND code_analyses.user_id = auth.uid()
        )
    );

-- Service role full access
CREATE POLICY "Service role full access to tests"
    ON tests FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- CUSTOMIZATION_EXERCISES TABLE POLICIES
-- ============================================

-- Everyone can view exercises (public catalog)
CREATE POLICY "Anyone can view exercises"
    ON customization_exercises FOR SELECT
    TO authenticated
    USING (true);

-- Service role full access
CREATE POLICY "Service role full access to customization_exercises"
    ON customization_exercises FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- EXERCISE_SUBMISSIONS TABLE POLICIES
-- ============================================

-- Users can view their own submissions
CREATE POLICY "Users can view own exercise submissions"
    ON exercise_submissions FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own submissions
CREATE POLICY "Users can insert own exercise submissions"
    ON exercise_submissions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to exercise_submissions"
    ON exercise_submissions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- PROJECT_SIMULATIONS TABLE POLICIES
-- ============================================

-- Everyone can view project simulations (public catalog)
CREATE POLICY "Anyone can view project simulations"
    ON project_simulations FOR SELECT
    TO authenticated
    USING (true);

-- Service role full access
CREATE POLICY "Service role full access to project_simulations"
    ON project_simulations FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- PROJECT_SUBMISSIONS TABLE POLICIES
-- ============================================

-- Users can view their own submissions
CREATE POLICY "Users can view own project submissions"
    ON project_submissions FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own submissions
CREATE POLICY "Users can insert own project submissions"
    ON project_submissions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to project_submissions"
    ON project_submissions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- USAGE_STATS TABLE POLICIES
-- ============================================

-- Users can view their own stats
CREATE POLICY "Users can view own usage stats"
    ON usage_stats FOR SELECT
    USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to usage_stats"
    ON usage_stats FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- FEEDBACK TABLE POLICIES
-- ============================================

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
    ON feedback FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert feedback
CREATE POLICY "Users can insert feedback"
    ON feedback FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to feedback"
    ON feedback FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

COMMIT;
