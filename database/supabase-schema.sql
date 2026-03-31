-- ============================================================================
-- DDREMS - Complete Supabase (PostgreSQL) Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  profile_approved BOOLEAN DEFAULT FALSE,
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_image VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTIES
CREATE TABLE IF NOT EXISTS properties (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(15,2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  type VARCHAR(50) NOT NULL,
  bedrooms INT,
  bathrooms INT,
  area DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  listing_type VARCHAR(20) DEFAULT 'sale',
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  features TEXT,
  broker_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  property_admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  main_image VARCHAR(500),
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTY IMAGES
CREATE TABLE IF NOT EXISTS property_images (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_type VARCHAR(50) DEFAULT 'gallery',
  uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTY VERIFICATION
CREATE TABLE IF NOT EXISTS property_verification (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  verification_status VARCHAR(50) DEFAULT 'pending',
  verification_notes TEXT,
  verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTY DOCUMENTS
CREATE TABLE IF NOT EXISTS property_documents (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  document_type VARCHAR(100) DEFAULT 'other',
  document_name VARCHAR(255) NOT NULL,
  document_path VARCHAR(500),
  document_url TEXT,
  access_key VARCHAR(100),
  is_locked BOOLEAN DEFAULT FALSE,
  uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENT ACCESS
CREATE TABLE IF NOT EXISTS document_access (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  response_message TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(50),
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGREEMENTS
CREATE TABLE IF NOT EXISTS agreements (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  broker_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  agreement_text TEXT,
  agreement_html TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  duration VARCHAR(100),
  payment_terms TEXT,
  special_conditions TEXT,
  additional_terms TEXT,
  owner_signature TEXT,
  customer_signature TEXT,
  owner_signed_at TIMESTAMPTZ,
  customer_signed_at TIMESTAMPTZ,
  reply_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- PROPERTY VIEWS
CREATE TABLE IF NOT EXISTS property_views (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEEDBACK
CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id BIGINT REFERENCES properties(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  is_group BOOLEAN DEFAULT FALSE,
  parent_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
  reply_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- MESSAGE RECIPIENTS (for group messages)
CREATE TABLE IF NOT EXISTS message_recipients (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(500),
  related_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SYSTEM CONFIG
CREATE TABLE IF NOT EXISTS system_config (
  id BIGSERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  description VARCHAR(500),
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id BIGINT,
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROFILE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone_number VARCHAR(20),
  address TEXT,
  profile_photo VARCHAR(500),
  id_document VARCHAR(500),
  profile_status VARCHAR(20) DEFAULT 'pending',
  approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS owner_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone_number VARCHAR(20),
  address TEXT,
  profile_photo VARCHAR(500),
  id_document VARCHAR(500),
  business_license VARCHAR(500),
  profile_status VARCHAR(20) DEFAULT 'pending',
  approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broker_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone_number VARCHAR(20),
  address TEXT,
  profile_photo VARCHAR(500),
  id_document VARCHAR(500),
  broker_license VARCHAR(500),
  license_number VARCHAR(100),
  profile_status VARCHAR(20) DEFAULT 'pending',
  approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_status_history (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL,
  profile_type VARCHAR(20) NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  changed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_edit_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id BIGINT,
  request_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- KEY REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS request_key (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  request_message TEXT,
  response_message TEXT,
  key_code VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- ============================================================================
-- PROPERTY REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_requests (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  broker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  request_type VARCHAR(50),
  request_message TEXT,
  response_message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- ============================================================================
-- COMMISSION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS commission_tracking (
  id BIGSERIAL PRIMARY KEY,
  broker_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  property_id BIGINT REFERENCES properties(id) ON DELETE SET NULL,
  transaction_id BIGINT REFERENCES transactions(id) ON DELETE SET NULL,
  agreement_request_id BIGINT,
  agreement_amount DECIMAL(15,2),
  commission_amount DECIMAL(15,2),
  commission_rate DECIMAL(5,2),
  customer_commission_percentage DECIMAL(5,2) DEFAULT 5,
  owner_commission_percentage DECIMAL(5,2) DEFAULT 5,
  customer_commission DECIMAL(15,2),
  owner_commission DECIMAL(15,2),
  total_commission DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYMENT CONFIRMATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_confirmations (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100) NOT NULL,
  receipt_document TEXT,
  confirmed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AGREEMENT WORKFLOW TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS agreement_requests (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  broker_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending_admin_review',
  current_step INT DEFAULT 1,
  customer_notes TEXT,
  request_message TEXT,
  owner_decision VARCHAR(20),
  owner_decision_date TIMESTAMPTZ,
  owner_notes TEXT,
  admin_action VARCHAR(20),
  admin_action_date TIMESTAMPTZ,
  admin_notes TEXT,
  admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  response_message TEXT,
  responded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  forwarded_to_owner_date TIMESTAMPTZ,
  agreement_generated_date TIMESTAMPTZ,
  customer_submitted_date TIMESTAMPTZ,
  owner_final_submitted_date TIMESTAMPTZ,
  owner_response_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  request_date TIMESTAMPTZ DEFAULT NOW(),
  property_price DECIMAL(15,2),
  commission_percentage DECIMAL(5,2) DEFAULT 5.00,
  customer_commission DECIMAL(15,2),
  owner_commission DECIMAL(15,2),
  total_commission DECIMAL(15,2),
  commission_calculated_date TIMESTAMPTZ,
  payment_confirmed BOOLEAN DEFAULT FALSE,
  payment_receipt_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_documents (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT REFERENCES agreement_requests(id) ON DELETE CASCADE,
  version INT DEFAULT 1,
  document_type VARCHAR(50) DEFAULT 'initial',
  document_content TEXT,
  document_html TEXT,
  generated_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  generated_date TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_signed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_fields (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT NOT NULL REFERENCES agreement_requests(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(100),
  field_type VARCHAR(50),
  field_value TEXT,
  is_editable BOOLEAN DEFAULT TRUE,
  is_required BOOLEAN DEFAULT FALSE,
  edited_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  edited_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agreement_request_id, field_name)
);

CREATE TABLE IF NOT EXISTS agreement_payments (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT REFERENCES agreement_requests(id) ON DELETE CASCADE,
  payment_method VARCHAR(50),
  payment_amount DECIMAL(15,2),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  receipt_file_path VARCHAR(500),
  receipt_file_name VARCHAR(255),
  receipt_uploaded_date TIMESTAMPTZ,
  payment_status VARCHAR(50),
  verified_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  verified_date TIMESTAMPTZ,
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_workflow_history (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT NOT NULL REFERENCES agreement_requests(id) ON DELETE CASCADE,
  step_number INT,
  step_name VARCHAR(100),
  action VARCHAR(100),
  action_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action_date TIMESTAMPTZ DEFAULT NOW(),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_commissions (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT NOT NULL REFERENCES agreement_requests(id) ON DELETE CASCADE,
  commission_type VARCHAR(50),
  recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_price DECIMAL(15,2),
  commission_percentage DECIMAL(5,2),
  commission_amount DECIMAL(15,2),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  calculated_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  calculated_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_notifications (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT REFERENCES agreement_requests(id) ON DELETE CASCADE,
  agreement_id BIGINT,
  recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100),
  notification_title VARCHAR(255),
  notification_message TEXT,
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_date TIMESTAMPTZ,
  sent_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_templates (
  id BIGSERIAL PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL,
  template_description TEXT,
  template_content TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_signatures (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT NOT NULL REFERENCES agreement_requests(id) ON DELETE CASCADE,
  signer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signer_role VARCHAR(50),
  signature_data TEXT,
  signature_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_transactions (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT NOT NULL REFERENCES agreement_requests(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50),
  transaction_status VARCHAR(50),
  buyer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  seller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  broker_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  property_id BIGINT REFERENCES properties(id) ON DELETE SET NULL,
  transaction_amount DECIMAL(15,2),
  commission_amount DECIMAL(15,2),
  net_amount DECIMAL(15,2),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_audit_log (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT REFERENCES agreement_requests(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  action_description TEXT,
  performed_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_receipts (
  id BIGSERIAL PRIMARY KEY,
  agreement_request_id BIGINT REFERENCES agreement_requests(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL,
  payment_amount DECIMAL(15,2) NOT NULL,
  receipt_file_path VARCHAR(500),
  receipt_file_name VARCHAR(255),
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_notes TEXT,
  verified_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  verification_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_agreement_status AS
SELECT
  ar.id, ar.customer_id, ar.owner_id, ar.property_id,
  ar.status, ar.current_step, ar.request_date, ar.created_at,
  ar.completion_date, ar.property_price, ar.total_commission,
  ar.commission_percentage, ar.customer_commission, ar.owner_commission,
  ar.property_admin_id,
  p.title AS property_title, p.price AS property_price_current,
  c.name AS customer_name, o.name AS owner_name, pa.name AS admin_name
FROM agreement_requests ar
LEFT JOIN properties p ON ar.property_id = p.id
LEFT JOIN users c ON ar.customer_id = c.id
LEFT JOIN users o ON ar.owner_id = o.id
LEFT JOIN users pa ON ar.property_admin_id = pa.id;

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

INSERT INTO system_config (config_key, config_value, description) VALUES
('site_name', 'DDREMS', 'System name'),
('commission_rate', '5', 'Default commission rate percentage'),
('max_property_images', '10', 'Maximum number of images per property')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO agreement_templates (template_name, template_description, template_content, is_active) VALUES
('Standard Agreement', 'Default real estate agreement template', 'This agreement is entered into between the buyer and seller...', TRUE)
ON CONFLICT DO NOTHING;
