-- CreateEnum
CREATE TYPE "public"."ListingTier" AS ENUM ('BASIC', 'PREMIUM', 'FEATURED');

-- AlterTable
ALTER TABLE "public"."providers" ADD COLUMN     "affiliateLink" TEXT,
ADD COLUMN     "isFeaturedCity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listingTier" "public"."ListingTier" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "serviceZipCodes" TEXT;
