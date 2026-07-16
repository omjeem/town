-- Overworld NPCs — buildingId becomes nullable (interior stays required,
-- overworld leaves it NULL) and `placement` carries the authored placement
-- descriptor so the server can re-materialize plot.overworldNpcs whenever a
-- building moves.

ALTER TABLE "Npc" ALTER COLUMN "buildingId" DROP NOT NULL;
ALTER TABLE "Npc" ADD COLUMN "placement" JSONB;
