-- PostgreSQL Schema for Joy Water Sports (JWS)
-- Single source of truth for database schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  emergency_contact_encrypted TEXT,
  is_legacy_auth BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure all required columns exist for existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_encrypted TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_legacy_auth BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

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

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(255) PRIMARY KEY,
  booking_id VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(255),
  email VARCHAR(255),
  date VARCHAR(255),
  time VARCHAR(255),
  guests INTEGER DEFAULT 1,
  activities TEXT,
  special_request TEXT,
  total_amount NUMERIC DEFAULT 0,
  advance_paid NUMERIC DEFAULT 0,
  balance_paid NUMERIC DEFAULT 0,
  remaining_due NUMERIC DEFAULT 0,
  payment_status VARCHAR(255) DEFAULT 'Pending',
  ticket_status VARCHAR(255) DEFAULT 'Pending',
  advance_payment_mode VARCHAR(255) DEFAULT 'Online',
  balance_payment_mode VARCHAR(255) DEFAULT 'Cash',
  source VARCHAR(50) NOT NULL DEFAULT 'online',
  booking_source VARCHAR(50) NOT NULL DEFAULT 'online',
  created_by VARCHAR(255),
  agent_name VARCHAR(255),
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure all required columns exist for existing databases
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50) NOT NULL DEFAULT 'online';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'online';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS agent_name VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

UPDATE bookings SET booking_id = id WHERE booking_id IS NULL OR booking_id = '';
UPDATE bookings SET booking_source = source WHERE booking_source IS NULL OR booking_source = '';

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  discount_type VARCHAR(50) DEFAULT 'percentage',
  discount_value NUMERIC DEFAULT 0,
  min_bill NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) DEFAULT 'percentage';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_bill NUMERIC DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
DO $$ 
BEGIN 
  ALTER TABLE coupons ALTER COLUMN discount DROP NOT NULL;
EXCEPTION 
  WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS admin_config (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE DEFAULT 'admin',
  password_hash TEXT,
  mobile_number VARCHAR(50),
  otp_code VARCHAR(50),
  otp_expiry VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS waiver_agreements (
  id VARCHAR(255) PRIMARY KEY,
  booking_id VARCHAR(255),
  guest_name VARCHAR(255),
  communication_address TEXT,
  phone VARCHAR(255),
  email VARCHAR(255),
  signature TEXT,
  agreement_date VARCHAR(255),
  has_minor BOOLEAN DEFAULT FALSE,
  guardian_name VARCHAR(255),
  guardian_address TEXT,
  guardian_phone VARCHAR(255),
  guardian_email VARCHAR(255),
  guardian_signature TEXT,
  guardian_agreement_date VARCHAR(255),
  date_of_sailing VARCHAR(255),
  invoice_no VARCHAR(255),
  boarding_pass_no VARCHAR(255),
  trip_1_time VARCHAR(255),
  trip_2_time VARCHAR(255),
  trip_3_time VARCHAR(255),
  trip_4_time VARCHAR(255),
  boat_g1 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sheet_sync_queue (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(255) UNIQUE NOT NULL,
  payload TEXT NOT NULL,
  attempt_count INT DEFAULT 1,
  last_error TEXT,
  synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS sheet_sync_logs (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
