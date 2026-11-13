# Pitchside documentation

Technical documentation for Pitchside, a mobile app for running local football tournaments.

| # | Document | Read it when you want to… |
| --- | --- | --- |
| 1 | [C4 model](c4-model.md) | See the system from the outside in: context → containers → components → code |
| 2 | [Architecture](architecture.md) | Understand the layers, the main design decisions and the folder layout |
| 3 | [System flows](system-flows.md) | Follow a user journey step by step (create, score, progress, crown) |
| 4 | [Tournament engine](tournament-engine.md) | Learn how draws, fixtures, tables and brackets are calculated |
| 5 | [Data model](data-model.md) | Know the types, the stored JSON shape and how to migrate it |
| 6 | [Design system](design-system.md) | Keep new screens consistent with the existing look |
| 7 | [Tech stack](tech-stack.md) | See which libraries are used and why |
| 8 | [Testing](testing.md) | Run and extend the test suite |
| 9 | [Build & release](build-and-release.md) | Ship an APK, a Play Store bundle or an iOS build |
| 10 | [Roadmap](roadmap.md) | See what's planned next, including monetisation options |
| — | [ADRs](adr/) | Read the reasons behind key decisions |

## Diagrams

All diagrams are written in [Mermaid](https://mermaid.js.org/), which GitHub renders inline. To edit one, change the text inside the ```` ```mermaid ```` block. You can preview it at <https://mermaid.live>.

## Conventions

- **Engine** means the pure TypeScript code in `src/engine/`. It has no React or React Native imports.
- **Tie** means a knockout pairing. It has one match, or two legs.
- **Fixture** means a league or group-stage match whose teams are fixed at draw time.
- **Source** means a placeholder for a knockout slot (for example "Winner QF 2" or "1st Group A"). It turns into a real team once the earlier stage is decided.
