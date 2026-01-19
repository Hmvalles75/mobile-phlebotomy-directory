-- Add location fields as source of truth on Provider table
-- These will be denormalized for performance and consistency

-- Add primary location fields (required for all providers)
ALTER TABLE "providers" ADD COLUMN "primaryState" TEXT;
ALTER TABLE "providers" ADD COLUMN "primaryStateName" TEXT;
ALTER TABLE "providers" ADD COLUMN "primaryStateSlug" TEXT;
ALTER TABLE "providers" ADD COLUMN "primaryCity" TEXT;
ALTER TABLE "providers" ADD COLUMN "primaryCitySlug" TEXT;

-- Add optional metro field for major metro areas
ALTER TABLE "providers" ADD COLUMN "primaryMetro" TEXT;

-- Add index for fast filtering
CREATE INDEX "idx_providers_primary_state" ON "providers"("primaryState");
CREATE INDEX "idx_providers_primary_city" ON "providers"("primaryCity");
CREATE INDEX "idx_providers_primary_metro" ON "providers"("primaryMetro");
