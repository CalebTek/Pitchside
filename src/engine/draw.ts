/** Colour tallies players pick before the random club draw. */
export const TALLIES: { name: string; color: string }[] = [
  { name: 'Red', color: '#FF4D5E' },
  { name: 'Blue', color: '#4C7DFF' },
  { name: 'Green', color: '#2EE07A' },
  { name: 'Gold', color: '#FFC93C' },
  { name: 'Purple', color: '#A77BFF' },
  { name: 'Orange', color: '#FF8A3D' },
  { name: 'Pink', color: '#FF6BD6' },
  { name: 'Cyan', color: '#2ED3F0' },
  { name: 'White', color: '#F2F5FF' },
  { name: 'Lime', color: '#C6F24E' },
  { name: 'Teal', color: '#19C2A0' },
  { name: 'Coral', color: '#FF8F7A' },
  { name: 'Sky', color: '#7FB2FF' },
  { name: 'Bronze', color: '#D19A66' },
  { name: 'Silver', color: '#AEB7CF' },
  { name: 'Magenta', color: '#E040FB' },
];

export const MAX_DRAW_PLAYERS = TALLIES.length;

export interface PoolClub {
  name: string;
  short?: string;
  color?: string;
}

/** Picks one club at random from those not drawn yet. Returns null if the pool is empty. */
export function pickRandom<T>(pool: T[], taken: Set<T>, rand: () => number = Math.random): T | null {
  const left = pool.filter((c) => !taken.has(c));
  if (!left.length) return null;
  return left[Math.floor(rand() * left.length)];
}

/** Draws `perPlayer` unique clubs for each of `players` tallies in one go. */
export function drawAll<T>(pool: T[], players: number, perPlayer: number, rand: () => number = Math.random): T[][] {
  if (pool.length < players * perPlayer) throw new Error('Not enough clubs in the pool');
  const taken = new Set<T>();
  const out: T[][] = Array.from({ length: players }, () => []);
  // Round by round, so a player's second club is drawn after everyone's first
  for (let round = 0; round < perPlayer; round++) {
    for (let p = 0; p < players; p++) {
      const c = pickRandom(pool, taken, rand)!;
      taken.add(c);
      out[p].push(c);
    }
  }
  return out;
}

export const maxPerPlayer = (poolSize: number, players: number) => (players ? Math.floor(poolSize / players) : 0);
