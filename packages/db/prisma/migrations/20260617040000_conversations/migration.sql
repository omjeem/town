-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "townId" TEXT NOT NULL,
    "aKey" TEXT NOT NULL,
    "bKey" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendingFromKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "fromKey" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_townId_aKey_bKey_key" ON "Conversation"("townId", "aKey", "bKey");

-- CreateIndex
CREATE INDEX "Conversation_townId_lastMessageAt_idx" ON "Conversation"("townId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_townId_fkey" FOREIGN KEY ("townId") REFERENCES "Town"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
