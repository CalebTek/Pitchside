export type Format = 'worldcup' | 'ucl' | 'league' | 'knockout';

export interface Team {
  id: string;
  name: string;
  /** Who controls this team (e.g. the gamer's name). Optional. */
  player?: string;
  color: string;
  /** Up to 3-letter code shown on the badge (e.g. MCI). Falls back to initials. */
  short?: string;
}

export interface Settings {
  /** Round-robin played twice (home & away) in league / group stage. */
  doubleRoundRobin: boolean;
  /** Knockout ties played over two legs. */
  koTwoLegs: boolean;
  /** Final is always a single match, even when ties are two-legged. */
  singleLegFinal: boolean;
  thirdPlace: boolean;
  // World Cup
  groupCount: number;
  advancePerGroup: number;
  bestThirds: number;
  // Champions League
  leagueMatches: number;
  koSize: number;
  playoff: boolean;
  // Points
  winPoints: number;
  drawPoints: number;
}

export interface Fixture {
  id: string;
  stage: 'league' | 'group';
  round: number;
  group?: number;
  home: string;
  away: string;
}

export type Source =
  | { kind: 'team'; teamId: string }
  | { kind: 'bye' }
  | { kind: 'group'; group: number; pos: number }
  | { kind: 'groupPlace'; place: number; rank: number }
  | { kind: 'table'; pos: number }
  | { kind: 'winner'; tieId: string }
  | { kind: 'loser'; tieId: string };

export interface Tie {
  id: string;
  a: Source;
  b: Source;
}

export interface KoRound {
  id: string;
  name: string;
  short: string;
  twoLegs: boolean;
  ties: Tie[];
  /** Third-place match is shown apart from the main bracket. */
  isThirdPlace?: boolean;
  isPlayoff?: boolean;
}

export interface Result {
  hs: number;
  as: number;
  hp?: number | null;
  ap?: number | null;
  /** Teams at the time the score was saved; if they change upstream the score is void. */
  h: string;
  a: string;
  at: number;
}

export interface Tournament {
  id: string;
  name: string;
  format: Format;
  createdAt: number;
  teams: Team[];
  settings: Settings;
  groups?: string[][];
  fixtures: Fixture[];
  ko: KoRound[];
  results: Record<string, Result>;
}

export interface Row {
  teamId: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: ('W' | 'D' | 'L')[];
}

/** A playable match, whatever stage it comes from. */
export interface MatchView {
  id: string;
  stage: 'league' | 'group' | 'knockout';
  roundLabel: string;
  roundKey: string;
  group?: number;
  home: string | null;
  away: string | null;
  result: Result | null;
  tieId?: string;
  leg?: 1 | 2;
  twoLegs?: boolean;
  /** Penalties are needed if this match finishes level (single leg / 2nd leg level on aggregate). */
  decider?: boolean;
  /** Aggregate before this leg (for 2nd legs), from the home team's view. */
  firstLeg?: { home: number; away: number } | null;
  /** Second leg can't be entered before the first. */
  locked?: boolean;
  /** Saved score is level (on aggregate) but no penalty winner was entered. */
  missingPens?: boolean;
}

export interface TieView {
  tie: Tie;
  round: KoRound;
  a: string | null;
  b: string | null;
  aBye: boolean;
  bBye: boolean;
  legs: MatchView[];
  aggA: number | null;
  aggB: number | null;
  pensA: number | null;
  pensB: number | null;
  winner: string | null;
  loser: string | null;
}
