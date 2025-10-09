-- ============================================
-- アトミックインクリメント関数
-- Date: 2025-01-10
-- Purpose: Race Condition を完全に排除
-- ============================================

-- 使用量カウンターをアトミックにインクリメントする関数
CREATE OR REPLACE FUNCTION increment_usage_count(
  p_user_id UUID,
  p_date DATE,
  p_column_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- INSERT ... ON CONFLICT DO UPDATE でアトミックに処理
  -- PostgreSQL の UPSERT 構文を使用
  EXECUTE format('
    INSERT INTO usage_stats (user_id, date, %I)
    VALUES ($1, $2, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET %I = COALESCE(usage_stats.%I, 0) + 1
  ', p_column_name, p_column_name, p_column_name)
  USING p_user_id, p_date;
END;
$$;

-- 関数のコメント
COMMENT ON FUNCTION increment_usage_count IS 'アトミックに使用量カウンターをインクリメント（Race Condition対策）';

-- ============================================
-- COMPLETION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Atomic Increment Function Created!';
    RAISE NOTICE 'Function: increment_usage_count(user_id, date, column_name)';
    RAISE NOTICE '========================================';
END $$;
