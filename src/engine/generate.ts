import type { Fixture, Format, KoRound, Settings, Source, Team, Tie, Tournament } from './types';

export const TEAM_COLORS = [
  '#3DF5A7', '#FFC93C', '#5B8CFF', '#FF5C7A', '#B07CFF', '#2ED3F0',
  '#FF8A3D', '#E8F05A', '#FF6BD6', '#4CE38A', '#7FA8FF', '#F2B5FF',
  '#FFB4A2', '#9CF2E0', '#D9B7FF', '#FFD86B',
];

let counter = 0;
export function uid(prefix = 'id'): string {
  counter = (counter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${counter.toString(36)}`;
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const nextPow2 = (n: number) => {
  let p = 1;
  while (p < n) p *= 2;
  return p;
};

export function defaultSettings(format: Format, teamCount: number): Settings {
  const s: Settings = {
    doubleRoundRobin: false,
    koTwoLegs: false,
    singleLegFinal: true,
    thirdPlace: false,
    groupCount: 2,
    advancePerGroup: 2,
    bestThirds: 0,
    leagueMatches: 8,
    koSize: 16,
    playoff: true,
    winPoints: 3,
    drawPoints: 1,
  };
  if (format === 'worldcup') {
    s.groupCount = Math.max(1, Math.round(teamCount / 4));
    s.thirdPlace = true;
  }
  if (format === 'ucl') {
    s.koTwoLegs = true;
    s.leagueMatches = Math.min(8, Math.max(1, teamCount - 1));
    // biggest bracket that still leaves room for a play-off round
    let k = 2;
    while (k * 2 * 1.5 <= teamCount) k *= 2;
    s.koSize = k;
    s.playoff = teamCount >= k * 1.5;
  }
  if (format === 'league') s.doubleRoundRobin = true;
  return s;
}

/** Plain-English check of a set-up; returns an error message or null. */
export function validate(format: Format, teamCount: number, s: Settings): string | null {
  if (teamCount < 2) return 'Add at least 2 teams.';
  if (format === 'worldcup') {
    if (s.groupCount < 1) return 'Need at least one group.';
    if (teamCount < s.groupCount * 2) return `${s.groupCount} groups need at least ${s.groupCount * 2} teams.`;
    const smallest = Math.floor(teamCount / s.groupCount);
    if (s.advancePerGroup >= smallest) return `Each group has only ${smallest} teams — fewer must advance.`;
    if (s.bestThirds > 0 && s.advancePerGroup !== 2) return 'Best third-placed teams only work when the top 2 advance.';
    if (s.bestThirds > s.groupCount) return 'Too many best third-placed teams.';
    if (s.bestThirds > 0 && smallest < 4) return 'Best thirds need groups of at least 4.';
    const q = s.groupCount * s.advancePerGroup + s.bestThirds;
    if (q < 2) return 'At least 2 teams must reach the knockouts.';
  }
  if (format === 'ucl') {
    if (teamCount < 4) return 'League phase needs at least 4 teams.';
    if (teamCount % 2 === 1) return 'League phase needs an even number of teams.';
    if (s.leagueMatches < 1 || s.leagueMatches > teamCount - 1)
      return `Each team can play between 1 and ${teamCount - 1} league matches.`;
    if (s.koSize < 2 || s.koSize > teamCount) return 'Knockout size is larger than the number of teams.';
    if (s.playoff && teamCount < s.koSize * 1.5)
      return `A play-off round for a ${s.koSize}-team knockout needs ${s.koSize * 1.5} teams.`;
  }
  return null;
}

/** Circle-method round robin. Returns rounds of [home, away] pairs. */
export function roundRobin(ids: string[]): [string, string][][] {
  const list: (string | null)[] = ids.slice();
  if (list.length % 2 === 1) list.push(null);
  const n = list.length;
  const rounds: [string, string][][] = [];
  const arr = list.slice();
  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const x = arr[i];
      const y = arr[n - 1 - i];
      if (x === null || y === null) continue;
      const swap = i === 0 ? r % 2 === 1 : i % 2 === 1;
      pairs.push(swap ? [y, x] : [x, y]);
    }
    rounds.push(pairs);
    // rotate all but first
    const last = arr.pop()!;
    arr.splice(1, 0, last);
  }
  return rounds;
}

/** Standard seeded bracket order: [1, 8, 4, 5, 2, 7, 3, 6] for 8. */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const len = order.length * 2;
    order = order.flatMap((s) => [s, len + 1 - s]);
  }
  return order;
}

export function roundName(teamsInRound: number): { name: string; short: string } {
  if (teamsInRound === 2) return { name: 'Final', short: 'F' };
  if (teamsInRound === 4) return { name: 'Semi-finals', short: 'SF' };
  if (teamsInRound === 8) return { name: 'Quarter-finals', short: 'QF' };
  return { name: `Round of ${teamsInRound}`, short: `R${teamsInRound}` };
}

/**
 * Builds a full bracket from seeded entries (entries[0] = seed 1).
 * Missing seeds become byes.
 */
export function buildBracket(entries: Source[], s: Settings, prefix = 'ko'): KoRound[] {
  const size = nextPow2(Math.max(2, entries.length));
  const order = seedOrder(size);
  const rounds: KoRound[] = [];
  let prev: Tie[] = [];
  let teamsInRound = size;
  let r = 0;
  while (teamsInRound >= 2) {
    const ties: Tie[] = [];
    if (r === 0) {
      for (let i = 0; i < size; i += 2) {
        const sa = order[i];
        const sb = order[i + 1];
        ties.push({
          id: `${prefix}${r}_${i / 2}`,
          a: entries[sa - 1] ?? { kind: 'bye' },
          b: entries[sb - 1] ?? { kind: 'bye' },
        });
      }
    } else {
      for (let i = 0; i < prev.length; i += 2) {
        ties.push({
          id: `${prefix}${r}_${i / 2}`,
          a: { kind: 'winner', tieId: prev[i].id },
          b: { kind: 'winner', tieId: prev[i + 1].id },
        });
      }
    }
    const nm = roundName(teamsInRound);
    const isFinal = teamsInRound === 2;
    rounds.push({
      id: `${prefix}${r}`,
      ...nm,
      twoLegs: s.koTwoLegs && !(isFinal && s.singleLegFinal),
      ties,
    });
    prev = ties;
    teamsInRound /= 2;
    r++;
  }
  if (s.thirdPlace && rounds.length >= 2) {
    const semis = rounds[rounds.length - 2];
    rounds.splice(rounds.length - 1, 0, {
      id: `${prefix}3rd`,
      name: 'Third place',
      short: '3rd',
      twoLegs: false,
      isThirdPlace: true,
      ties: [
        {
          id: `${prefix}3rd_0`,
          a: { kind: 'loser', tieId: semis.ties[0].id },
          b: { kind: 'loser', tieId: semis.ties[1].id },
        },
      ],
    });
  }
  return rounds;
}

function groupEntries(s: Settings): Source[] {
  const G = s.groupCount;
  const k = s.advancePerGroup;
  const q = G * k + s.bestThirds;
  const isPow2 = (n: number) => n >= 2 && (n & (n - 1)) === 0;
  // Classic cross-over (A1 v B2, B1 v A2 …) — keeps group-mates apart until the final.
  if (k === 2 && s.bestThirds === 0 && isPow2(G) && G >= 2) {
    return [];
  }
  const out: Source[] = [];
  for (let place = 1; place <= k; place++)
    for (let rank = 1; rank <= G; rank++) out.push({ kind: 'groupPlace', place, rank });
  for (let rank = 1; rank <= s.bestThirds; rank++) out.push({ kind: 'groupPlace', place: 3, rank });
  return out.slice(0, q);
}

function classicCrossover(s: Settings): KoRound[] {
  const G = s.groupCount;
  const top: Tie[] = [];
  const bottom: Tie[] = [];
  for (let g = 0; g < G; g += 2) {
    top.push({ id: '', a: { kind: 'group', group: g, pos: 1 }, b: { kind: 'group', group: g + 1, pos: 2 } });
    bottom.push({ id: '', a: { kind: 'group', group: g + 1, pos: 1 }, b: { kind: 'group', group: g, pos: 2 } });
  }
  // Interleave so that within each half, winners of adjacent pairs meet later
  const firstTies = [...top, ...bottom].map((t, i) => ({ ...t, id: `ko0_${i}` }));
  const rounds: KoRound[] = [];
  let prev = firstTies;
  let teams = firstTies.length * 2;
  let r = 0;
  while (teams >= 2) {
    const ties =
      r === 0
        ? firstTies
        : Array.from({ length: prev.length / 2 }, (_, i) => ({
            id: `ko${r}_${i}`,
            a: { kind: 'winner', tieId: prev[i * 2].id } as Source,
            b: { kind: 'winner', tieId: prev[i * 2 + 1].id } as Source,
          }));
    const isFinal = teams === 2;
    rounds.push({ id: `ko${r}`, ...roundName(teams), twoLegs: s.koTwoLegs && !(isFinal && s.singleLegFinal), ties });
    prev = ties;
    teams /= 2;
    r++;
  }
  if (s.thirdPlace && rounds.length >= 2) {
    const semis = rounds[rounds.length - 2];
    rounds.splice(rounds.length - 1, 0, {
      id: 'ko3rd',
      name: 'Third place',
      short: '3rd',
      twoLegs: false,
      isThirdPlace: true,
      ties: [{ id: 'ko3rd_0', a: { kind: 'loser', tieId: semis.ties[0].id }, b: { kind: 'loser', tieId: semis.ties[1].id } }],
    });
  }
  return rounds;
}

function uclKnockout(teamCount: number, s: Settings): KoRound[] {
  const K = s.koSize;
  const rounds: KoRound[] = [];
  const entries: Source[] = [];
  if (s.playoff && teamCount >= K * 1.5) {
    const ties: Tie[] = [];
    for (let t = 1; t <= K / 2; t++) {
      ties.push({ id: `po_${t}`, a: { kind: 'table', pos: K / 2 + t }, b: { kind: 'table', pos: (3 * K) / 2 + 1 - t } });
    }
    rounds.push({ id: 'po', name: 'Knockout play-offs', short: 'PO', twoLegs: s.koTwoLegs, ties, isPlayoff: true });
    for (let seed = 1; seed <= K; seed++) {
      entries.push(seed <= K / 2 ? { kind: 'table', pos: seed } : { kind: 'winner', tieId: `po_${seed - K / 2}` });
    }
  } else {
    for (let seed = 1; seed <= K; seed++) entries.push({ kind: 'table', pos: seed });
  }
  return [...rounds, ...buildBracket(entries, s)];
}

/** Pick `m` distinct round-robin rounds → every team plays m different opponents. */
function swissFixtures(ids: string[], m: number, rand: () => number): Fixture[] {
  const rr = roundRobin(shuffle(ids, rand));
  const picked = shuffle(rr, rand).slice(0, m);
  const fixtures: Fixture[] = [];
  picked.forEach((pairs, r) => {
    shuffle(pairs, rand).forEach(([h, a], i) => {
      fixtures.push({ id: `L${r}_${i}`, stage: 'league', round: r, home: h, away: a });
    });
  });
  return fixtures;
}

function leagueFixtures(ids: string[], double: boolean, stage: 'league' | 'group', group?: number): Fixture[] {
  const rr = roundRobin(ids);
  const rounds = double ? [...rr, ...rr.map((p) => p.map(([h, a]) => [a, h] as [string, string]))] : rr;
  const out: Fixture[] = [];
  const tag = stage === 'group' ? `G${group}` : 'L';
  rounds.forEach((pairs, r) =>
    pairs.forEach(([h, a], i) => out.push({ id: `${tag}_${r}_${i}`, stage, round: r, group, home: h, away: a })),
  );
  return out;
}

export interface CreateInput {
  name: string;
  format: Format;
  teams: Team[];
  settings: Settings;
  /** Shuffle teams for the draw; otherwise the entered order is used as seeding. */
  randomDraw: boolean;
  rand?: () => number;
}

export function createTournament(input: CreateInput): Tournament {
  const rand = input.rand ?? Math.random;
  const s = { ...input.settings };
  const teams = input.teams;
  const ordered = input.randomDraw ? shuffle(teams, rand) : teams.slice();
  const ids = ordered.map((t) => t.id);
  const t: Tournament = {
    id: uid('t'),
    name: input.name.trim() || 'My Tournament',
    format: input.format,
    createdAt: Date.now(),
    teams,
    settings: s,
    fixtures: [],
    ko: [],
    results: {},
  };

  if (input.format === 'league') {
    t.fixtures = leagueFixtures(ids, s.doubleRoundRobin, 'league');
  } else if (input.format === 'knockout') {
    t.ko = buildBracket(ids.map((teamId) => ({ kind: 'team', teamId })), s);
  } else if (input.format === 'worldcup') {
    // Snake the (seeded or shuffled) list into groups so pot strength is spread.
    const G = s.groupCount;
    const groups: string[][] = Array.from({ length: G }, () => []);
    ids.forEach((id, i) => {
      const row = Math.floor(i / G);
      const col = i % G;
      groups[row % 2 === 0 ? col : G - 1 - col].push(id);
    });
    t.groups = groups;
    t.fixtures = groups.flatMap((g, gi) => leagueFixtures(g, s.doubleRoundRobin, 'group', gi));
    const entries = groupEntries(s);
    t.ko = entries.length ? buildBracket(entries, s) : classicCrossover(s);
  } else if (input.format === 'ucl') {
    t.fixtures = swissFixtures(ids, s.leagueMatches, rand);
    t.ko = uclKnockout(teams.length, s);
  }
  return t;
}

export const FORMAT_INFO: Record<Format, { title: string; tagline: string; icon: string }> = {
  worldcup: { title: 'World Cup', tagline: 'Groups, then knockouts', icon: 'earth' },
  ucl: { title: 'Champions League', tagline: 'League phase, play-offs, knockouts', icon: 'star-four-points' },
  league: { title: 'League', tagline: 'Everyone plays everyone', icon: 'format-list-numbered' },
  knockout: { title: 'Knockout Cup', tagline: 'Win or go home', icon: 'tournament' },
};

export const groupLetter = (i: number) => String.fromCharCode(65 + i);
