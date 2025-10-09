-- ============================================
-- ユーザー承認システム追加
-- Date: 2025-01-09
-- ============================================

-- profilesテーブルにapproval_status, approval_notes, approved_at, approved_by追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- コメント
COMMENT ON COLUMN profiles.approval_status IS 'ユーザー承認ステータス: pending(承認待ち), approved(承認済み), rejected(拒否)';
COMMENT ON COLUMN profiles.approval_notes IS '承認/拒否時の管理者メモ';
COMMENT ON COLUMN profiles.approved_at IS '承認/拒否された日時';
COMMENT ON COLUMN profiles.approved_by IS '承認/拒否した管理者のID';
COMMENT ON COLUMN profiles.is_admin IS '管理者フラグ';

-- RLSポリシー: 管理者のみが全ユーザーを閲覧可能
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- RLSポリシー: 管理者のみが承認ステータスを更新可能
DROP POLICY IF EXISTS "Admins can update user approval" ON profiles;
CREATE POLICY "Admins can update user approval" ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- COMPLETION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User Approval System Added Successfully!';
    RAISE NOTICE 'Added columns: approval_status, approval_notes, approved_at, approved_by, is_admin';
    RAISE NOTICE '========================================';
END $$;
