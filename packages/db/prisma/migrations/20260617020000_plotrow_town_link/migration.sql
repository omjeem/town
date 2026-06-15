-- AlterTable
ALTER TABLE "PlotRow" ADD COLUMN "townId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PlotRow_townId_key" ON "PlotRow"("townId");

-- AddForeignKey
ALTER TABLE "PlotRow" ADD CONSTRAINT "PlotRow_townId_fkey" FOREIGN KEY ("townId") REFERENCES "Town"("id") ON DELETE SET NULL ON UPDATE CASCADE;
