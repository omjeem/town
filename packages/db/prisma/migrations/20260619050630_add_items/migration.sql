-- AlterTable
ALTER TABLE "Town" ADD COLUMN     "catalogJson" JSONB;

-- CreateTable
CREATE TABLE "VisitorTag" (
    "id" TEXT NOT NULL,
    "townSlug" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "awardedByNpc" TEXT,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorItem" (
    "id" TEXT NOT NULL,
    "townSlug" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "awardedByNpc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitorTag_townSlug_subjectKey_idx" ON "VisitorTag"("townSlug", "subjectKey");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorTag_townSlug_subjectKey_tagId_key" ON "VisitorTag"("townSlug", "subjectKey", "tagId");

-- CreateIndex
CREATE INDEX "VisitorItem_townSlug_subjectKey_createdAt_idx" ON "VisitorItem"("townSlug", "subjectKey", "createdAt");

-- CreateIndex
CREATE INDEX "VisitorItem_templateId_createdAt_idx" ON "VisitorItem"("templateId", "createdAt");
