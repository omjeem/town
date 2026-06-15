-- CreateTable
CREATE TABLE "Town" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Town_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Town_slug_key" ON "Town"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Town_ownerId_key" ON "Town"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Town_shareCode_key" ON "Town"("shareCode");

-- AddForeignKey
ALTER TABLE "Town" ADD CONSTRAINT "Town_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
