-- Migration: Create Supporting Tables
-- Description: Admin users, media library, audit log

-- ==================== ADMIN USERS ====================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- ==================== MEDIA LIBRARY ====================
CREATE TABLE IF NOT EXISTS media_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL, -- bytes
    width INTEGER,
    height INTEGER,
    cdn_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text VARCHAR(255),
    title VARCHAR(255),
    tags JSONB DEFAULT '[]'::JSONB,
    uploaded_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_uploaded_by ON media_library(uploaded_by);
CREATE INDEX idx_media_mime_type ON media_library(mime_type);
CREATE INDEX idx_media_tags ON media_library USING GIN (tags);

-- ==================== CONTENT AUDIT LOG ====================
CREATE TABLE IF NOT EXISTS content_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- create, update, delete, publish, unpublish
    old_data JSONB,
    new_data JSONB,
    changes_summary TEXT,
    user_id UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_content ON content_audit_log(content_type, content_id);
CREATE INDEX idx_audit_user ON content_audit_log(user_id);
CREATE INDEX idx_audit_created_at ON content_audit_log(created_at);

-- ==================== HELPER FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to admin_users
CREATE TRIGGER admin_users_updated_at_trigger
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE admin_users IS 'CMS admin user accounts with RBAC';
COMMENT ON TABLE media_library IS 'Centralized media storage with CDN URLs';
COMMENT ON TABLE content_audit_log IS 'Tracks all content changes for accountability';
