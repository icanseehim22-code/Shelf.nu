-- CreateTable
CREATE TABLE "shelf"."UserBusinessIntel" (
    "id" TEXT NOT NULL,
    "howDidYouHearAboutUs" TEXT,
    "jobTitle" TEXT,
    "teamSize" TEXT,
    "companyName" TEXT,
    "primaryUseCase" TEXT,
    "currentSolution" TEXT,
    "timeline" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBusinessIntel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBusinessIntel_userId_key" ON "shelf"."UserBusinessIntel"("userId");

-- CreateIndex
CREATE INDEX "UserBusinessIntel_userId_idx" ON "shelf"."UserBusinessIntel"("userId");

-- CreateIndex
CREATE INDEX "UserBusinessIntel_companyName_idx" ON "shelf"."UserBusinessIntel"("companyName");

-- CreateIndex
CREATE INDEX "UserBusinessIntel_jobTitle_idx" ON "shelf"."UserBusinessIntel"("jobTitle");

-- CreateIndex
CREATE INDEX "UserBusinessIntel_teamSize_idx" ON "shelf"."UserBusinessIntel"("teamSize");

-- AddForeignKey
ALTER TABLE "shelf"."UserBusinessIntel" ADD CONSTRAINT "UserBusinessIntel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shelf"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "UserBusinessIntel" ENABLE row level security;
