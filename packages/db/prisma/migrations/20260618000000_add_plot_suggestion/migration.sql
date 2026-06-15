-- Queued plot/NPC change waiting for the player's approval. The events
-- worker writes these instead of mutating the plot directly.

-- CreateTable
CREATE TABLE "PlotSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PlotSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlotSuggestion_userId_status_idx" ON "PlotSuggestion"("userId", "status");

-- CreateIndex
CREATE INDEX "PlotSuggestion_userId_createdAt_idx" ON "PlotSuggestion"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PlotSuggestion" ADD CONSTRAINT "PlotSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
