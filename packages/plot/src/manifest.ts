// Shape of the catalog playground's extras manifest. Lives at
// apps/web/public/sprites/extras/MANIFEST.json. The generator + the
// renderer both load this at runtime; the type lives here so both sides
// can import the same shape.

export interface ManifestEntry {
  id: string;
  file: string;
  tileW: number;
  tileH: number;
}

export interface Manifest {
  trees: ManifestEntry[];
  bushes: ManifestEntry[];
  flowers: ManifestEntry[];
  stumps: ManifestEntry[];
  grass: ManifestEntry[];
  mushrooms: ManifestEntry[];
  rocks: ManifestEntry[];
  dirtPatches?: ManifestEntry[];
  apron?: ManifestEntry[];
  buildings?: ManifestEntry[];
}
