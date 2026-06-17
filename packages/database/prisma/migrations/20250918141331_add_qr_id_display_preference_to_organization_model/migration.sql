-- CreateEnum
CREATE TYPE "shelf"."QrIdDisplayPreference" AS ENUM ('QR_ID', 'SAM_ID');

-- AlterTable
ALTER TABLE "shelf"."Organization" ADD COLUMN     "qrIdDisplayPreference" "shelf"."QrIdDisplayPreference" NOT NULL DEFAULT 'QR_ID';
