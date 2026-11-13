import { groupLetter } from './generate';
import type { Fixture, KoRound, MatchView, Result, Row, Source, Tie, TieView, Tournament } from './types';

/** A saved result only counts if it was entered for the teams currently in the slot. */
function validResult(t: Tournament, id: string, home: string | null, away: string | null): Result | null {
  const r = t.results[id];
  if (!r || !home || !away) return null;
  return r.h === home && r.a === away ? r : null;
}

export function computeTable(t: Tournament, fixtures: Fixture[], teamIds: string[]): Row[] {
  const rows = new Map<string, Row>();
  teamIds.forEach((id) => rows.set(id, { teamId: id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] }));
  const { winPoints, drawPoints } = t.settings;
  const played = fixtures
    .map((f) => ({ f, r: validResult(t, f.id, f.home, f.away) }))
    .filter((x): x is { f: Fixture; r: Result } => !!x.r)
    .sort((x, y) => x.f.round - y.f.round || x.r.at - y.r.at);
  for (const { f, r } of played) {
    const h = rows.get(f.home);
    const a = rows.get(f.away);
    if (!h || !a) continue;
    h.p++; a.p++;
    h.gf += r.hs; h.ga += r.as;
    a.gf += r.as; a.ga += r.hs;
    if (r.hs > r.as) {
      h.w++; a.l++; h.pts += winPoints; h.form.push('W'); a.form.push('L');
    } else if (r.hs < r.as) {
      a.w++; h.l++; a.pts += winPoints; a.form.push('W'); h.form.push('L');
    } else {
      h.d++; a.d++; h.pts += drawPoints; a.pts += drawPoints; h.form.push('D'); a.form.push('D');
    }
  }
  const list = [...rows.values()];
  list.forEach((r) => {
    r.gd = r.gf - r.ga;
    r.form = r.form.slice(-5);
  });
  const name = (id: string) => t.teams.find((x) => x.id === id)?.name ?? '';
  return list.sort(
    (x, y) =>
      y.pts - x.pts ||
      y.gd - x.gd ||
      y.gf - x.gf ||
      y.w - x.w ||
      headToHead(t, played, x.teamId, y.teamId) ||
      name(x.teamId).localeCompare(name(y.teamId)),
  );
}

function headToHead(t: Tournament, played: { f: Fixture; r: Result }[], a: string, b: string): number {
  let pa = 0;
  let pb = 0;
  for (const { f, r } of played) {
    const isAB = f.home === a && f.away === b;
    const isBA = f.home === b && f.away === a;
    if (!isAB && !isBA) continue;
    const ga = isAB ? r.hs : r.as;
    const gb = isAB ? r.as : r.hs;
    if (ga > gb) pa += t.settings.winPoints;
    else if (gb > ga) pb += t.settings.winPoints;
    else { pa += t.settings.drawPoints; pb += t.settings.drawPoints; }
  }
  return pb - pa;
}

const done = (t: Tournament, fx: Fixture[]) => fx.every((f) => !!validResult(t, f.id, f.home, f.away));

export class Resolver {
  private tieCache = new Map<string, TieView>();
  private tieIndex = new Map<string, { tie: Tie; round: KoRound }>();
  private groupTables = new Map<number, Row[]>();
  private leagueTable: Row[] | null = null;

  constructor(public t: Tournament) {
    t.ko.forEach((round) => round.ties.forEach((tie) => this.tieIndex.set(tie.id, { tie, round })));
  }

  groupFixtures(g: number) {
    return this.t.fixtures.filter((f) => f.stage === 'group' && f.group === g);
  }

  groupTable(g: number): Row[] {
    if (!this.groupTables.has(g)) {
      this.groupTables.set(g, computeTable(this.t, this.groupFixtures(g), this.t.groups?.[g] ?? []));
    }
    return this.groupTables.get(g)!;
  }

  groupComplete(g: number) {
    return done(this.t, this.groupFixtures(g));
  }

  allGroupsComplete() {
    return (this.t.groups ?? []).every((_, g) => this.groupComplete(g));
  }

  table(): Row[] {
    if (!this.leagueTable) {
      const lf = this.t.fixtures.filter((f) => f.stage === 'league');
      this.leagueTable = computeTable(this.t, lf, this.t.teams.map((x) => x.id));
    }
    return this.leagueTable;
  }

  leagueComplete() {
    return done(this.t, this.t.fixtures.filter((f) => f.stage === 'league'));
  }

  /** Teams finishing in `place` across all groups, best first. */
  placeRanking(place: number): Row[] {
    const rows: Row[] = [];
    (this.t.groups ?? []).forEach((_, g) => {
      const r = this.groupTable(g)[place - 1];
      if (r) rows.push(r);
    });
    // Compare fairly when groups differ in size: use points-per-game style ordering on raw stats
    return rows.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || y.w - x.w);
  }

  /** Returns team id, 'BYE', or null when not decided yet. */
  source(s: Source): string | 'BYE' | null {
    switch (s.kind) {
      case 'team':
        return s.teamId;
      case 'bye':
        return 'BYE';
      case 'group':
        return this.groupComplete(s.group) ? this.groupTable(s.group)[s.pos - 1]?.teamId ?? null : null;
      case 'groupPlace':
        return this.allGroupsComplete() ? this.placeRanking(s.place)[s.rank - 1]?.teamId ?? null : null;
      case 'table':
        return this.leagueComplete() ? this.table()[s.pos - 1]?.teamId ?? null : null;
      case 'winner':
      case 'loser': {
        const v = this.tie(s.tieId);
        if (!v) return null;
        if (v.aBye && v.bBye) return 'BYE';
        if (s.kind === 'winner') return v.winner;
        // a bye "loses" — the third-place slot becomes a bye too
        if (v.aBye || v.bBye) return v.winner ? 'BYE' : null;
        return v.loser;
      }
    }
  }

  sourceLabel(s: Source): string {
    switch (s.kind) {
      case 'team':
        return this.t.teams.find((x) => x.id === s.teamId)?.name ?? '?';
      case 'bye':
        return 'Bye';
      case 'group':
        return `${ordinal(s.pos)} Group ${groupLetter(s.group)}`;
      case 'groupPlace':
        return s.place === 3 ? `Best 3rd #${s.rank}` : `${ordinal(s.place)}-place #${s.rank}`;
      case 'table':
        return `${ordinal(s.pos)} in league`;
      case 'winner':
      case 'loser': {
        const info = this.tieIndex.get(s.tieId);
        if (!info) return 'TBD';
        const idx = info.round.ties.indexOf(info.tie) + 1;
        return `${s.kind === 'winner' ? 'Winner' : 'Loser'} ${info.round.short}${info.round.ties.length > 1 ? ' ' + idx : ''}`;
      }
    }
  }

  tie(id: string): TieView | null {
    if (this.tieCache.has(id)) return this.tieCache.get(id)!;
    const info = this.tieIndex.get(id);
    if (!info) return null;
    const { tie, round } = info;
    const ra = this.source(tie.a);
    const rb = this.source(tie.b);
    const aBye = ra === 'BYE';
    const bBye = rb === 'BYE';
    const a = aBye ? null : ra;
    const b = bBye ? null : rb;
    const view: TieView = {
      tie, round, a, b, aBye, bBye, legs: [],
      aggA: null, aggB: null, pensA: null, pensB: null, winner: null, loser: null,
    };

    if (aBye || bBye) {
      // Bye: the other side walks through as soon as it's known (two byes → bye).
      view.winner = aBye && bBye ? null : aBye ? b : a;
      this.tieCache.set(id, view);
      return view;
    }

    const leg1: MatchView = {
      id: `${tie.id}-1`, stage: 'knockout', roundLabel: round.name, roundKey: round.id,
      home: a, away: b, result: validResult(this.t, `${tie.id}-1`, a, b),
      tieId: tie.id, leg: 1, twoLegs: round.twoLegs, decider: !round.twoLegs, firstLeg: null,
    };
    view.legs.push(leg1);
    if (round.twoLegs) {
      const r1 = leg1.result;
      const leg2: MatchView = {
        id: `${tie.id}-2`, stage: 'knockout', roundLabel: round.name, roundKey: round.id,
        home: b, away: a, result: validResult(this.t, `${tie.id}-2`, b, a),
        tieId: tie.id, leg: 2, twoLegs: true, decider: true,
        firstLeg: r1 ? { home: r1.as, away: r1.hs } : null,
        locked: !r1,
      };
      view.legs.push(leg2);
      const r2 = leg2.result;
      if (r1 && r2) {
        view.aggA = r1.hs + r2.as;
        view.aggB = r1.as + r2.hs;
        if (view.aggA === view.aggB) {
          view.pensA = r2.ap ?? null;
          view.pensB = r2.hp ?? null;
        }
      } else if (r1) {
        view.aggA = r1.hs;
        view.aggB = r1.as;
      }
      if (r1 && r2) this.decide(view);
    } else if (leg1.result) {
      const r = leg1.result;
      view.aggA = r.hs;
      view.aggB = r.as;
      if (r.hs === r.as) {
        view.pensA = r.hp ?? null;
        view.pensB = r.ap ?? null;
      }
      this.decide(view);
    }
    this.tieCache.set(id, view);
    return view;
  }

  private decide(v: TieView) {
    if (v.aggA === null || v.aggB === null) return;
    let aWins: boolean | null = null;
    if (v.aggA !== v.aggB) aWins = v.aggA > v.aggB;
    else if (v.pensA !== null && v.pensB !== null && v.pensA !== v.pensB) aWins = v.pensA > v.pensB;
    if (aWins === null) {
      const last = v.legs[v.legs.length - 1];
      if (last) last.missingPens = true;
      return;
    }
    v.winner = aWins ? v.a : v.b;
    v.loser = aWins ? v.b : v.a;
  }

  /** All matches that exist in this tournament (league/group + every knockout leg). */
  matches(): MatchView[] {
    const out: MatchView[] = this.t.fixtures.map((f) => ({
      id: f.id,
      stage: f.stage,
      group: f.group,
      roundLabel: `Matchday ${f.round + 1}`,
      roundKey: `md${f.round}`,
      home: f.home,
      away: f.away,
      result: validResult(this.t, f.id, f.home, f.away),
    }));
    for (const round of this.t.ko) {
      for (const tie of round.ties) {
        const v = this.tie(tie.id)!;
        if (v.aBye || v.bBye) continue;
        out.push(...v.legs);
      }
    }
    return out;
  }

  match(id: string): MatchView | null {
    return this.matches().find((m) => m.id === id) ?? null;
  }

  final(): TieView | null {
    const main = this.t.ko.filter((r) => !r.isThirdPlace);
    const last = main[main.length - 1];
    return last ? this.tie(last.ties[0].id) : null;
  }

  thirdPlace(): TieView | null {
    const r = this.t.ko.find((x) => x.isThirdPlace);
    return r ? this.tie(r.ties[0].id) : null;
  }

  podium(): { champion: string | null; runnerUp: string | null; third: string | null } {
    if (this.t.format === 'league') {
      if (!this.leagueComplete()) return { champion: null, runnerUp: null, third: null };
      const tb = this.table();
      return { champion: tb[0]?.teamId ?? null, runnerUp: tb[1]?.teamId ?? null, third: tb[2]?.teamId ?? null };
    }
    const f = this.final();
    const third = this.thirdPlace();
    return { champion: f?.winner ?? null, runnerUp: f?.loser ?? null, third: third?.winner ?? null };
  }

  progress(): { played: number; total: number } {
    // Count every slot that will need a match, not just the ones currently known
    let total = this.t.fixtures.length;
    let played = this.t.fixtures.filter((f) => validResult(this.t, f.id, f.home, f.away)).length;
    for (const round of this.t.ko) {
      for (const tie of round.ties) {
        const v = this.tie(tie.id)!;
        const isByeTie = tie.a.kind === 'bye' || tie.b.kind === 'bye' || v.aBye || v.bBye;
        if (isByeTie) continue;
        const legs = round.twoLegs ? 2 : 1;
        total += legs;
        played += v.legs.filter((l) => l.result).length;
      }
    }
    return { played, total };
  }

  stageLabel(): string {
    const { champion } = this.podium();
    if (champion) return 'Finished';
    if (this.t.format === 'league') return 'League';
    if (this.t.format === 'worldcup' && !this.allGroupsComplete()) return 'Group stage';
    if (this.t.format === 'ucl' && !this.leagueComplete()) return 'League phase';
    for (const round of this.t.ko) {
      if (round.isThirdPlace) continue;
      const open = round.ties.some((tie) => {
        const v = this.tie(tie.id)!;
        return !(v.aBye || v.bBye) && !v.winner;
      });
      if (open) return round.name;
    }
    return 'Knockouts';
  }

  /** Is the score for a decider level and therefore needs penalties? */
  needsPens(m: MatchView, hs: number, as: number): boolean {
    if (m.stage !== 'knockout' || !m.decider) return false;
    if (!m.twoLegs) return hs === as;
    if (!m.firstLeg) return false;
    // leg 2 view: home here = team b; firstLeg is from leg-2 home's view
    return m.firstLeg.home + hs === m.firstLeg.away + as;
  }
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Zone colouring for league tables. */
export function zoneFor(t: Tournament, pos: number, groupSize?: number): 'direct' | 'playoff' | 'out' | 'third' | null {
  const s = t.settings;
  if (t.format === 'ucl') {
    const playoff = s.playoff && t.teams.length >= s.koSize * 1.5;
    if (playoff) {
      if (pos <= s.koSize / 2) return 'direct';
      if (pos <= s.koSize * 1.5) return 'playoff';
      return 'out';
    }
    return pos <= s.koSize ? 'direct' : 'out';
  }
  if (t.format === 'worldcup') {
    if (pos <= s.advancePerGroup) return 'direct';
    if (s.bestThirds > 0 && pos === 3) return 'third';
    return groupSize ? 'out' : null;
  }
  if (t.format === 'league') return pos === 1 ? 'direct' : null;
  return null;
}
