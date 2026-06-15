-- Per-user NPC roster. One row per (building, NPC). The town CLI mirrors
-- these into .mdx files inside the plot directory.

-- CreateTable
CREATE TABLE "Npc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Npc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Npc_userId_idx" ON "Npc"("userId");

-- CreateIndex
CREATE INDEX "Npc_userId_buildingId_idx" ON "Npc"("userId", "buildingId");

-- AddForeignKey
ALTER TABLE "Npc" ADD CONSTRAINT "Npc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
