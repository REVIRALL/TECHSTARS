-- プラン制限チェック付きのアトミックインクリメント
-- Race Condition完全対策版

CREATE OR REPLACE FUNCTION check_and_increment_usage(
  p_user_id UUID,
  p_date DATE,
  p_column_name TEXT,
  p_daily_limit INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count INTEGER;
  v_new_count INTEGER;
BEGIN
  -- アトミックにインクリメントして新しい値を取得
  EXECUTE format('
    INSERT INTO usage_stats (user_id, date, %I)
    VALUES ($1, $2, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET %I = COALESCE(usage_stats.%I, 0) + 1
    RETURNING %I
  ', p_column_name, p_column_name, p_column_name, p_column_name)
  INTO v_new_count
  USING p_user_id, p_date;

  -- 制限チェック（-1 = 無制限）
  IF p_daily_limit != -1 AND v_new_count > p_daily_limit THEN
    -- 制限超過の場合はロールバック不要（カウントは記録する）
    -- エラーを返して呼び出し側で判断
    RAISE EXCEPTION 'Daily limit exceeded: % / %', v_new_count, p_daily_limit
      USING ERRCODE = 'P0001'; -- user-defined exception
  END IF;

  RETURN v_new_count;
END;
$$;

COMMENT ON FUNCTION check_and_increment_usage IS
'アトミックに使用量をインクリメントし、制限チェックを実行。Race Condition対策済み。';
