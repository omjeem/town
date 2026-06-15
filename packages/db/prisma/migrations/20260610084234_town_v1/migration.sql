-- CreateTable
CREATE TABLE "TownStateRow" (
    "userId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TownStateRow_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "TownEventRow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "TownEventRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationRow" (
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "scopes" TEXT[],
    "connectedAt" TIMESTAMP(3) NOT NULL,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationRow_pkey" PRIMARY KEY ("userId","slug")
);

-- CreateTable
CREATE TABLE "AspectRow" (
    "uuid" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aspect" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "validAt" TIMESTAMP(3) NOT NULL,
    "invalidAt" TIMESTAMP(3),
    "invalidatedBy" TEXT,

    CONSTRAINT "AspectRow_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "TownEventRow_userId_occurredAt_idx" ON "TownEventRow"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "TownEventRow_userId_type_idx" ON "TownEventRow"("userId", "type");

-- CreateIndex
CREATE INDEX "IntegrationRow_userId_idx" ON "IntegrationRow"("userId");

-- CreateIndex
CREATE INDEX "AspectRow_userId_aspect_idx" ON "AspectRow"("userId", "aspect");

-- CreateIndex
CREATE INDEX "AspectRow_userId_invalidAt_idx" ON "AspectRow"("userId", "invalidAt");

-- AddForeignKey
ALTER TABLE "TownStateRow" ADD CONSTRAINT "TownStateRow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TownEventRow" ADD CONSTRAINT "TownEventRow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationRow" ADD CONSTRAINT "IntegrationRow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AspectRow" ADD CONSTRAINT "AspectRow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
