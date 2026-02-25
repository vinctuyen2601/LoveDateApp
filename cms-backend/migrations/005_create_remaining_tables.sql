-- Migration: Create Gift Suggestions, Checklist Templates, Badge Definitions, Subscription Plans
-- Description: Remaining content types for CMS

-- ==================== GIFT SUGGESTIONS ====================
CREATE TABLE IF NOT EXISTS gift_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('gift', 'experience', 'activity', 'romantic_plan')),

    -- Scoring Criteria (JSONB arrays - for filtering algorithm)
    category JSONB DEFAULT '[]'::JSONB,
    budget JSONB DEFAULT '[]'::JSONB,
    occasion JSONB DEFAULT '[]'::JSONB,
    personality JSONB DEFAULT '[]'::JSONB,
    hobbies JSONB DEFAULT '[]'::JSONB,
    love_language JSONB DEFAULT '[]'::JSONB,
    gender VARCHAR(20), -- Nam, Nữ, Khác
    relationship_stage JSONB DEFAULT '[]'::JSONB,

    -- Details
    why_great TEXT,
    tips JSONB DEFAULT '[]'::JSONB,

    -- Related Content
    related_products JSONB DEFAULT '[]'::JSONB,
    related_articles JSONB DEFAULT '[]'::JSONB,

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

CREATE INDEX idx_gift_suggestions_type ON gift_suggestions(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_gift_suggestions_status ON gift_suggestions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_gift_suggestions_version ON gift_suggestions(version);

-- ==================== CHECKLIST TEMPLATES ====================
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_category VARCHAR(50) NOT NULL, -- birthday, anniversary, holiday, default

    -- Template Items (JSONB array)
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    -- Structure: [{title, dueDaysBefore, order}]

    -- Relationship-specific customization
    relationship_specific JSONB DEFAULT '{}'::JSONB,

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

CREATE INDEX idx_checklist_event_category ON checklist_templates(event_category);
CREATE INDEX idx_checklist_status ON checklist_templates(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_checklist_version ON checklist_templates(version);

-- ==================== BADGE DEFINITIONS ====================
CREATE TABLE IF NOT EXISTS badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_type VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,

    -- Requirements (JSONB - for unlocking logic)
    requirements JSONB NOT NULL,
    -- Structure: {minEvents: 1} or {minStreak: 7} or {minGifts: 5}

    -- Rewards
    rewards JSONB DEFAULT '{}'::JSONB,
    -- Structure: {points: 100, premiumDays: 7}

    -- Publishing
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),

    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_badges_status ON badge_definitions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_badges_version ON badge_definitions(version);

-- ==================== SUBSCRIPTION PLANS ====================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_type VARCHAR(50) UNIQUE NOT NULL, -- free, monthly, yearly
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    billing_cycle VARCHAR(20), -- monthly, yearly, one-time

    -- Limits & Features (JSONB)
    features JSONB NOT NULL,
    -- Structure: {maxEvents: 10, hasAnalytics: false, featureList: [...]}

    -- Display
    is_popular BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,

    -- Publishing
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),

    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_status ON subscription_plans(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_plans_version ON subscription_plans(version);
CREATE INDEX idx_plans_display_order ON subscription_plans(display_order);

-- ==================== VERSION TRIGGERS ====================
CREATE OR REPLACE FUNCTION increment_gift_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_version_trigger
    BEFORE UPDATE ON gift_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION increment_gift_version();

CREATE OR REPLACE FUNCTION increment_checklist_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER checklist_version_trigger
    BEFORE UPDATE ON checklist_templates
    FOR EACH ROW
    EXECUTE FUNCTION increment_checklist_version();

CREATE OR REPLACE FUNCTION increment_badge_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER badge_version_trigger
    BEFORE UPDATE ON badge_definitions
    FOR EACH ROW
    EXECUTE FUNCTION increment_badge_version();

CREATE OR REPLACE FUNCTION increment_plan_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_version_trigger
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION increment_plan_version();
