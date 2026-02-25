-- Migration: Create Surveys Table
-- Description: MBTI, love language, personality surveys

CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('mbti', 'love_language', 'personality', 'compatibility')),
    description TEXT,

    -- Questions & Results (JSONB)
    questions JSONB NOT NULL DEFAULT '[]'::JSONB,
    -- Structure: [{id, question, optionA, optionB, dimensionA, dimensionB}]

    results JSONB NOT NULL DEFAULT '{}'::JSONB,
    -- Structure: {INTJ: {title, description, traits[]}, ENFP: {...}, ...}

    -- Scoring
    scoring_algorithm JSONB, -- Custom scoring logic

    -- Publishing
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,

    -- Analytics
    completion_count INTEGER DEFAULT 0,
    average_duration_seconds INTEGER,

    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id)
);

CREATE INDEX idx_surveys_type ON surveys(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_surveys_status ON surveys(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_surveys_version ON surveys(version);

-- Auto-increment version trigger
CREATE OR REPLACE FUNCTION increment_survey_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER survey_version_trigger
    BEFORE UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION increment_survey_version();

COMMENT ON TABLE surveys IS 'Survey questions and results for personality/compatibility tests';
