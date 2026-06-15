-- Drop the legacy materialised TownState. The plot renderer reads from
-- PlotRow now, and CORE events are stored verbatim in TownEventRow as a
-- write-only audit log without being folded into TownState. The rules
-- engine, bootstrap, and curator have all been removed.

-- DropForeignKey
ALTER TABLE "TownStateRow" DROP CONSTRAINT IF EXISTS "TownStateRow_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "TownStateRow";
