# Testing

## Strategy

| Level | What | How |
| --- | --- | --- |
| **Engine (automated)** | Draws, fixtures, standings, progression, aggregates, penalties, byes, edit invalidation | `npm test`: simulation tests in `src/engine/engine.test.ts` |
| **Types** | Whole codebase | `npm run typecheck` (`tsc --noEmit`) |
| **UI (manual / scripted)** | Screens, navigation, score entry | Expo Go on a device, or `npx expo start --web` with a browser automation script |

The engine has no React dependencies, so tests run in Node in about a second, with no emulator.

## Running

```bash
npm test             # → "121 tests passed"
npm run typecheck
```

## How the simulation tests work

Most tests play whole tournaments with a **seeded random number generator**:

1. Build a tournament with `createTournament` and a deterministic `rand`.
2. Repeat: get every playable, unlocked match from the Resolver, give it a random score, and add penalties when `needsPens` says so.
3. Stop when nothing is left to play.
4. Check the invariants.

Each scenario runs with 5 different seeds.

### Invariants checked

| Area | Assertion |
| --- | --- |
| Every format | A champion and runner-up exist. `progress.played === progress.total` |
| League | Every team played `2 × (n−1)` games in a double round robin |
| Knockout (2–16 teams) | Byes handled, two-legged and single-leg ties both finish |
| World Cup | Right number of groups, every team drawn once, the champion actually qualified, qualifier count = `G×k + bestThirds` |
| World Cup 32 | Each half of the R16 holds exactly one team from every group (crossover) |
| Champions League | Every team plays exactly `m` matches against `m` **different** opponents. The champion finished within the qualifying places. The first play-off tie is 9th v 24th |
| Two-legged tie | Aggregate maths, leg-2 `firstLeg` view, when penalties are needed, winner on penalties |
| Edits | Changing a semi-final voids a final that now has different teams |
| Validation | Odd team count in a league phase is rejected. Too many groups are rejected |
| Tally draw | Every player gets the right number of clubs, no club is drawn twice, every club in the pool can be drawn, a pool that is too small is rejected, tally colours are unique |

## Adding a test

```ts
test('my new rule', () => {
  const t = make('worldcup', 12, { groupCount: 3 }, /* seed */ 42);
  const r = playAll(t, rng(42));
  assert.ok(r.podium().champion);
});
```

## Manual release checklist

- [ ] Create one tournament of each format with placeholder teams
- [ ] Top clubs: search, league filter, a pack, select all; clubs already added show as added
- [ ] Tally draw: 4 players, 2 clubs each; spin one tally, then Draw all; Use these teams → 8 teams with the right players and colours
- [ ] Enter a draw in a single-leg knockout → shoot-out appears and must have a winner
- [ ] Two-legged tie: leg 2 locked until leg 1 saved; aggregate shown
- [ ] Edit a group result after the knockouts started → bracket updates
- [ ] Final result → champion screen appears
- [ ] Kill and reopen the app → data still there
- [ ] Delete tournament / clear scores from the ⋯ menu
