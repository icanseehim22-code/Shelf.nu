-- AlterTable
ALTER TABLE "shelf"."CustomTierLimit" ADD COLUMN     "canHideShelfBranding" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "shelf"."Organization" ADD COLUMN     "showShelfBranding" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "shelf"."TierLimit" ADD COLUMN     "canHideShelfBranding" BOOLEAN NOT NULL DEFAULT false;
