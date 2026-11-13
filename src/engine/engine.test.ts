import assert from 'node:assert/strict';
import { drawAll, pickRandom, maxPerPlayer, TALLIES } from './draw';
import {
  Resolver, Settings, Tournament, Format, Team, createTournament, defaultSettings, validate, seedOrder, TEAM_COLORS,
} from './index';

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function teams(n: number): Team[] {
  return Array.from({ length: n }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}`, color: TEAM_COLORS[i % 16] }));
}

/** Plays every playable match with random scores until a champion is crowned. */
function playAll(t: Tournament, rand: () => number) {
  for (let guard = 0; guard < 500; guard++) {
    const r = new Resolver(t);
    const open = r.matches().filter((m) => m.home && m.away && !m.result && !m.locked);
    if (!open.length) break;
    for (const m of open) {
      const hs = Math.floor(rand() * 4);
      const as = Math.floor(rand() * 4);
      let hp: number | null = null;
      let ap: number | null = null;
      if (r.needsPens(m, hs, as)) {
        hp = 5;
        ap = 3 + Math.floor(rand() * 2) * 3; // 3 or 6
      }
      t.results[m.id] = { hs, as, hp, ap, h: m.home!, a: m.away!, at: Date.now() };
    }
  }
  return new Resolver(t);
}

function make(format: Format, n: number, patch: Partial<Settings> = {}, seed = 1) {
  const s = { ...defaultSettings(format, n), ...patch };
  const err = validate(format, n, s);
  assert.equal(err, null, `${format} ${n}: ${err}`);
  return createTournament({ name: 'x', format, teams: teams(n), settings: s, randomDraw: true, rand: rng(seed) });
}

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log('✓', name);
}

test('seed order', () => {
  assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
});

for (const seed of [1, 2, 3, 4, 5]) {
  test(`league 5 teams double (seed ${seed})`, () => {
    const t = make('league', 5, {}, seed);
    assert.equal(t.fixtures.length, 20);
    const r = playAll(t, rng(seed));
    const tb = r.table();
    tb.forEach((row) => assert.equal(row.p, 8));
    assert.ok(r.podium().champion);
    assert.equal(r.stageLabel(), 'Finished');
  });

  for (const n of [2, 3, 5, 7, 8, 13, 16]) {
    test(`knockout ${n} teams (seed ${seed})`, () => {
      const t = make('knockout', n, { koTwoLegs: seed % 2 === 0, thirdPlace: n >= 4 }, seed);
      const r = playAll(t, rng(seed));
      const p = r.podium();
      assert.ok(p.champion, 'champion');
      assert.ok(p.runnerUp, 'runner up');
      const prog = r.progress();
      assert.equal(prog.played, prog.total);
    });
  }

  for (const [n, G, k, b] of [
    [32, 8, 2, 0], [16, 4, 2, 0], [8, 2, 2, 0], [12, 3, 2, 0], [24, 6, 2, 4], [10, 2, 2, 0], [6, 1, 2, 0], [9, 3, 1, 0],
  ] as const) {
    test(`world cup ${n} teams / ${G} groups / top ${k} + ${b} thirds (seed ${seed})`, () => {
      const t = make('worldcup', n, { groupCount: G, advancePerGroup: k, bestThirds: b, koTwoLegs: seed === 3 }, seed);
      assert.equal(t.groups!.length, G);
      assert.equal(t.groups!.flat().length, n);
      const r = playAll(t, rng(seed));
      const p = r.podium();
      assert.ok(p.champion, 'champion');
      // the champion must have qualified from its group
      const qualified = new Set<string>();
      t.groups!.forEach((_, g) => r.groupTable(g).slice(0, k).forEach((row) => qualified.add(row.teamId)));
      r.placeRanking(3).slice(0, b).forEach((row) => qualified.add(row.teamId));
      assert.ok(qualified.has(p.champion!), 'champion qualified');
      assert.equal(qualified.size, G * k + b);
      const prog = r.progress();
      assert.equal(prog.played, prog.total);
    });
  }

  test(`world cup 32: group-mates split into opposite halves (seed ${seed})`, () => {
    const t = make('worldcup', 32, { groupCount: 8 }, seed);
    const r16 = t.ko[0];
    assert.equal(r16.ties.length, 8);
    const half1 = r16.ties.slice(0, 4).flatMap((x) => [x.a, x.b]).map((s) => (s.kind === 'group' ? s.group : -1));
    const half2 = r16.ties.slice(4).flatMap((x) => [x.a, x.b]).map((s) => (s.kind === 'group' ? s.group : -1));
    assert.deepEqual([...half1].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual([...half2].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
  });

  for (const [n, m, K, po] of [
    [36, 8, 16, true], [10, 6, 4, true], [8, 4, 4, false], [16, 6, 8, true], [20, 8, 8, true], [4, 3, 2, false],
  ] as const) {
    test(`champions league ${n} teams, ${m} games, KO ${K}${po ? ' + playoffs' : ''} (seed ${seed})`, () => {
      const t = make('ucl', n, { leagueMatches: m, koSize: K, playoff: po }, seed);
      // every team plays exactly m distinct opponents
      const opp = new Map<string, Set<string>>();
      const count = new Map<string, number>();
      for (const f of t.fixtures) {
        for (const [x, y] of [[f.home, f.away], [f.away, f.home]]) {
          if (!opp.has(x)) opp.set(x, new Set());
          assert.ok(!opp.get(x)!.has(y), 'repeat opponent');
          opp.get(x)!.add(y);
          count.set(x, (count.get(x) ?? 0) + 1);
        }
      }
      assert.equal(count.size, n);
      count.forEach((c) => assert.equal(c, m));
      const r = playAll(t, rng(seed));
      const p = r.podium();
      assert.ok(p.champion);
      const table = r.table().map((x) => x.teamId);
      const cut = po ? K * 1.5 : K;
      assert.ok(table.indexOf(p.champion!) < cut, 'champion came from a qualifying spot');
      if (po) {
        const playoff = t.ko[0];
        assert.ok(playoff.isPlayoff);
        assert.equal(playoff.ties.length, K / 2);
        // 9th v 24th style pairing
        const first = r.tie(playoff.ties[0].id)!;
        assert.equal(first.a, table[K / 2]);
        assert.equal(first.b, table[K * 1.5 - 1]);
      }
    });
  }
}

test('editing an earlier score voids dependent knockout results', () => {
  const t = make('knockout', 4, { koTwoLegs: false, thirdPlace: false }, 9);
  let r = playAll(t, rng(9));
  const champ = r.podium().champion!;
  // flip semi-final 1 result
  const semi = r.tie(t.ko[0].ties[0].id)!;
  const m = semi.legs[0];
  const old = t.results[m.id];
  const winnerWasHome = semi.winner === m.home;
  t.results[m.id] = { ...old, hs: winnerWasHome ? 0 : 5, as: winnerWasHome ? 5 : 0, hp: null, ap: null };
  r = new Resolver(t);
  const final = r.final()!;
  // If the final's line-up changed, it must be unplayed now
  if (final.a !== semi.winner) {
    assert.equal(final.winner, null);
    assert.equal(r.podium().champion, null);
  }
  assert.ok(champ);
});

test('two-legged tie: aggregate and penalties', () => {
  const t = make('knockout', 2, { koTwoLegs: true, singleLegFinal: false }, 1);
  const r0 = new Resolver(t);
  const v0 = r0.tie(t.ko[0].ties[0].id)!;
  const [l1, l2] = v0.legs;
  t.results[l1.id] = { hs: 2, as: 1, h: l1.home!, a: l1.away!, at: 1 };
  const r1 = new Resolver(t);
  const leg2 = r1.match(l2.id)!;
  assert.deepEqual(leg2.firstLeg, { home: 1, away: 2 });
  assert.equal(r1.needsPens(leg2, 1, 0), true);
  assert.equal(r1.needsPens(leg2, 2, 0), false);
  t.results[l2.id] = { hs: 1, as: 0, hp: 4, ap: 2, h: l2.home!, a: l2.away!, at: 2 };
  const r2 = new Resolver(t);
  const v = r2.tie(t.ko[0].ties[0].id)!;
  assert.equal(v.aggA, 2);
  assert.equal(v.aggB, 2);
  assert.equal(v.winner, l2.home);
});

test('validation messages', () => {
  assert.match(validate('ucl', 9, defaultSettings('ucl', 9))!, /even/);
  assert.match(validate('worldcup', 6, { ...defaultSettings('worldcup', 6), groupCount: 4 })!, /need at least/);
});

test('tally draw: unique clubs, right counts', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const pool = Array.from({ length: 20 }, (_, i) => `Club ${i}`);
    const res = drawAll(pool, 6, 3, rng(seed));
    assert.equal(res.length, 6);
    res.forEach((r) => assert.equal(r.length, 3));
    const flat = res.flat();
    assert.equal(new Set(flat).size, 18);
    flat.forEach((c) => assert.ok(pool.includes(c)));
  }
  assert.throws(() => drawAll(['a', 'b'], 3, 1));
  assert.equal(maxPerPlayer(20, 6), 3);
  assert.equal(pickRandom(['a'], new Set(['a'])), null);
  assert.equal(new Set(TALLIES.map((t) => t.color)).size, TALLIES.length);
});

test('tally draw: every club can be drawn (not biased to the front)', () => {
  const pool = ['A', 'B', 'C', 'D', 'E'];
  const seen = new Set<string>();
  const r = rng(11);
  for (let i = 0; i < 200; i++) seen.add(drawAll(pool, 1, 1, r)[0][0]);
  assert.equal(seen.size, 5);
});

console.log(`\n${passed} tests passed`);
