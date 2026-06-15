-- CreateTable
CREATE TABLE "LabelRow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coreLabelId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "kind" TEXT,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabelRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabelRow_userId_idx" ON "LabelRow"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LabelRow_userId_name_key" ON "LabelRow"("userId", "name");

-- AddForeignKey
ALTER TABLE "LabelRow" ADD CONSTRAINT "LabelRow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
