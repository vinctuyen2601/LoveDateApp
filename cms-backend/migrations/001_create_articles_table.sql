-- Migration: Create Articles Table
-- Description: Stores all article content with CMS fields for publishing workflow

CREATE TABLE IF NOT EXISTS articles (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('gifts', 'dates', 'communication', 'zodiac', 'personality')),
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    content TEXT NOT NULL, -- HTML from rich text editor
    image_url TEXT,
    author VARCHAR(100),
    read_time INTEGER,
    tags JSONB DEFAULT '[]'::JSONB,

    -- Analytics
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,

    -- Publishing Workflow
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,

    -- SEO
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    slug VARCHAR(255) UNIQUE,

    -- Versioning & Sync
    version INTEGER NOT NULL DEFAULT 1,

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Audit
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id)
);

-- Indexes for performance
CREATE INDEX idx_articles_status ON articles(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_articles_category ON articles(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_articles_featured ON articles(is_featured) WHERE status = 'published';
CREATE INDEX idx_articles_version ON articles(version);
CREATE INDEX idx_articles_tags ON articles USING GIN (tags);
CREATE INDEX idx_articles_search ON articles USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
);

-- Auto-increment version trigger
CREATE OR REPLACE FUNCTION increment_article_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_version_trigger
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION increment_article_version();

-- Auto-update timestamp trigger
CREATE TRIGGER article_updated_at_trigger
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE articles IS 'Stores all article content for the Love Date App';
COMMENT ON COLUMN articles.version IS 'Auto-incrementing version number for incremental sync';
COMMENT ON COLUMN articles.deleted_at IS 'Soft delete timestamp - NULL means not deleted';
