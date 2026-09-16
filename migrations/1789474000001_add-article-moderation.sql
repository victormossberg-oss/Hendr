ALTER TABLE Events
ADD COLUMN moderation_status VARCHAR(20) NOT NULL DEFAULT 'safe',
ADD COLUMN moderation_categories TEXT[],
ADD COLUMN moderation_confidence DECIMAL(5,4),
ADD COLUMN moderated_at TIMESTAMP;