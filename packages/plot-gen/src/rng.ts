// Seeded RNG primitives. Direct port of the catalog playground's pgHash /
// pgShuffle. Stable across runs (and across language ports — same
// math should yield identical output in Rust if we ever rewrite).

/** xmur3-style 32-bit hash. Not cryptographic; fine for picking quadrants
 *  and selecting decor weights. Returns an unsigned 32-bit int. */
export function hash32(s: string): number {
  let h = (1779033703 ^ s.length) >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353) >>> 0;
    h = ((h << 13) | (h >>> 19)) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic Fisher-Yates with the seed mixed in via per-index hash. */
export function shuffle<T>(arr: T[], seed: string): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = hash32(seed + "::" + i) % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
