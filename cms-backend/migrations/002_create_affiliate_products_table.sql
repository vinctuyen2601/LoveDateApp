-- Migration: Create Affiliate Products Table
-- Description: Stores all affiliate product recommendations

CREATE TABLE IF NOT EXISTS affiliate_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('gift', 'restaurant', 'hotel', 'spa', 'travel')),
    subcategory VARCHAR(100) NOT NULL,

    -- Pricing
    price_range VARCHAR(50),
    price DECIMAL(10, 2),
    original_price DECIMAL(10, 2),

    -- Rating
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,

    -- Media
    image_url TEXT,
    gallery_urls JSONB DEFAULT '[]'::JSONB,

    -- Affiliate
    affiliate_url TEXT NOT NULL,
    affiliate_partner VARCHAR(100),
    commission_rate DECIMAL(5, 2),

    -- Filtering (JSONB arrays)
    occasion JSONB DEFAULT '[]'::JSONB, -- ["birthday", "valentine", "8_3", etc.]
    budget JSONB DEFAULT '[]'::JSONB,   -- ["Dưới 200k", "200k-500k", etc.]
    tags JSONB DEFAULT '[]'::JSONB,

    -- Display
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_popular BOOLEAN DEFAULT FALSE,

    -- Publishing
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

    -- Analytics
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,

    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id)
);

-- Indexes
CREATE INDEX idx_products_category ON affiliate_products(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON affiliate_products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_version ON affiliate_products(version);
CREATE INDEX idx_products_occasion ON affiliate_products USING GIN (occasion);
CREATE INDEX idx_products_budget ON affiliate_products USING GIN (budget);
CREATE INDEX idx_products_tags ON affiliate_products USING GIN (tags);
CREATE INDEX idx_products_popular ON affiliate_products(is_popular) WHERE status = 'published';

-- Auto-increment version trigger
CREATE OR REPLACE FUNCTION increment_product_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_version_trigger
    BEFORE UPDATE ON affiliate_products
    FOR EACH ROW
    EXECUTE FUNCTION increment_product_version();

COMMENT ON TABLE affiliate_products IS 'Affiliate product recommendations';
COMMENT ON COLUMN affiliate_products.occasion IS 'JSONB array of occasion tags for filtering';
COMMENT ON COLUMN affiliate_products.budget IS 'JSONB array of budget ranges';
