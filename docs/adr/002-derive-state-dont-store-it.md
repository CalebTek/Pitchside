# ADR-002: Store inputs only and derive tournament state

**Status:** Accepted · **Date:** 2026-11

## Context
Organisers make mistakes and correct scores, often after later rounds have already been played. If tables, qualifiers and bracket slots were stored, every edit would need careful updating of everything downstream. Those updates are easy to get wrong.

## Decision
- A `Tournament` stores only **inputs**: teams, settings, the draw (groups and fixtures), the knockout *skeleton* made of placeholder `Source`s, and `results` keyed by match ID.
- Everything else (standings, which team fills each slot, tie winners, podium, progress, stage) is **calculated** by the `Resolver`.
- Each `Result` records the teams it was entered for (`h`, `a`). If the calculated teams for that match change, the result is ignored.

## Consequences
- Editing any score instantly and correctly updates the whole competition.
- No update-cascading code and no stale data.
- Old results are kept but ignored. If the user undoes the change, they come back.
- Calculation runs on every change. That's cheap at local-tournament sizes and wrapped in `useMemo`.
