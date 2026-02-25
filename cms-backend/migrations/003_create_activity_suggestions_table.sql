-- Migration: Create Activity Suggestions Table
-- Description: Date ideas, restaurants, locations

CREATE TABLE IF NOT EXISTS activity_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('restaurant', 'activity', 'location')),

    -- Location
    location VARCHAR(100), -- Quận/Thành phố
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Pricing
    price_range VARCHAR(50), -- ₫, ₫₫, ₫₫₫, ₫₫₫₫

    -- Rating
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),

    -- Contact
    booking_url TEXT,
    phone_number VARCHAR(20),

    -- Media & Description
    image_url TEXT,
    description TEXT,
    tags JSONB DEFAULT '[]'::JSONB,

    -- Publishing
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id)
);

-- Indexes
CREATE INDEX idx_activities_category ON activity_suggestions(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_location ON activity_suggestions(location) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_version ON activity_suggestions(version);
CREATE INDEX idx_activities_tags ON activity_suggestions USING GIN (tags);
CREATE INDEX idx_activities_geo ON activity_suggestions USING GIST (
    ll_to_earth(latitude, longitude)
); -- Geospatial search

-- Auto-increment version trigger
CREATE OR REPLACE FUNCTION increment_activity_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_version_trigger
    BEFORE UPDATE ON activity_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION increment_activity_version();

COMMENT ON TABLE activity_suggestions IS 'Date ideas, restaurants, and location recommendations';
