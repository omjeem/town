-- CreateTable
CREATE TABLE "PlotRow" (
    "userId" TEXT NOT NULL,
    "json" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlotRow_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "PlotRow" ADD CONSTRAINT "PlotRow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
