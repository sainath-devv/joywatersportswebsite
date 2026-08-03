-- Step-by-Step Safe Non-Destructive Migration Script for NeonDB
-- Author: Joy Watersports Engineering
-- Purpose: Add multi-device auth, refresh token rotation, & encrypted fields without dropping existing user data.

-- 1. Create a safety backup table before making schema changes (Rollback Safety)
CREATE TABLE IF NOT EXISTS users_backup_pre_v2 AS SELECT * FROM users;

-- 2. Additive migration to `users` table
-- Ensures all required auth & security fields exist without altering or dropping existing columns.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_encrypted TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_legacy_auth BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. Create `refresh_tokens` table for session tracking and token rotation per device
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    device_info TEXT,
    ip_address TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    replaced_by_token VARCHAR(64)
);

ALTER TABLE refresh_tokens ALTER COLUMN ip_address TYPE TEXT;

-- Indexing for fast token validation & cleanup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- 4. Graceful Legacy Password Backfill Flag Initialization
-- Marks existing users who have non-bcrypt unhashed passwords so backend can auto-hash them on next login.
UPDATE users 
SET is_legacy_auth = TRUE 
WHERE (password_hash IS NULL OR password_hash NOT LIKE '$2b$%') 
  AND is_legacy_auth IS NOT TRUE;
