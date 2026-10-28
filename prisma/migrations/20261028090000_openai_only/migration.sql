-- OpenAI is the only AI provider (product owner, 2026-10-27).
-- The enum values stay so historical AiOutput and template rows keep
-- their provenance; nothing new is written with the retired value.

ALTER TABLE "prompt_templates" ALTER COLUMN "provider" SET DEFAULT 'openai';

UPDATE "prompt_templates" SET "provider" = 'openai' WHERE "provider" = 'anthropic';

-- The provider setting is gone, and a shared default model that names a
-- Claude model would be sent to OpenAI, so it falls back to the built-in.
DELETE FROM "system_settings" WHERE "key" = 'ai.default_provider';
DELETE FROM "system_settings" WHERE "key" = 'ai.default_model' AND "value" ILIKE 'claude%';

-- An Anthropic connection can no longer be tested or used; keep the row,
-- mark it disabled.
UPDATE "integration_connections" SET "status" = 'disabled' WHERE "integrationType" = 'anthropic';
