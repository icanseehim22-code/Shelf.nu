-- AlterTable
ALTER TABLE "shelf"."CustomField" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CustomField_organizationId_deletedAt_idx" ON "shelf"."CustomField"("organizationId", "deletedAt");
