-- CreateEnum
CREATE TYPE "shelf"."UpdateStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- DropIndex
DROP INDEX "shelf"."_AssetToBooking_Asset_idx";

-- DropIndex
DROP INDEX "shelf"."_AssetToTag_asset_idx";

-- CreateTable
CREATE TABLE "shelf"."Update" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "status" "shelf"."UpdateStatus" NOT NULL DEFAULT 'DRAFT',
    "targetRoles" "shelf"."OrganizationRoles"[],
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelf"."UserUpdateRead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserUpdateRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Update_status_publishDate_idx" ON "shelf"."Update"("status", "publishDate");

-- CreateIndex
CREATE INDEX "Update_publishDate_idx" ON "shelf"."Update"("publishDate");

-- CreateIndex
CREATE INDEX "Update_createdById_idx" ON "shelf"."Update"("createdById");

-- CreateIndex
CREATE INDEX "UserUpdateRead_userId_idx" ON "shelf"."UserUpdateRead"("userId");

-- CreateIndex
CREATE INDEX "UserUpdateRead_updateId_idx" ON "shelf"."UserUpdateRead"("updateId");

-- CreateIndex
CREATE INDEX "UserUpdateRead_readAt_idx" ON "shelf"."UserUpdateRead"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserUpdateRead_userId_updateId_key" ON "shelf"."UserUpdateRead"("userId", "updateId");

-- AddForeignKey
ALTER TABLE "shelf"."Update" ADD CONSTRAINT "Update_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "shelf"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelf"."UserUpdateRead" ADD CONSTRAINT "UserUpdateRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shelf"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelf"."UserUpdateRead" ADD CONSTRAINT "UserUpdateRead_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "shelf"."Update"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "Update" ENABLE row level security;
ALTER TABLE "UserUpdateRead" ENABLE row level security;
