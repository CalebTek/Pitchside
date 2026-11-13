# System flows

Step-by-step views of the main user journeys.

## 1. App launch

```mermaid
sequenceDiagram
    autonumber
    participant OS as Android / iOS
    participant L as _layout.tsx
    participant Z as Zustand persist
    participant AS as AsyncStorage
    participant H as Home screen

    OS->>L: Start JS bundle (Hermes)
    L->>L: SplashScreen.preventAutoHideAsync()
    par Fonts
        L->>L: useFonts(Barlow Condensed, Inter)
    and Rehydrate
        Z->>AS: getItem("pitchside-v1")
        AS-->>Z: JSON { state: { tournaments } }
    end
    L->>L: SplashScreen.hideAsync()
    L->>H: Render stack root
    H->>H: For each tournament: new Resolver(t) → stage, progress, champion
```

## 2. Create a tournament

```mermaid
sequenceDiagram
    autonumber
    actor U as Organiser
    participant W as Create wizard
    participant G as engine/generate
    participant R as engine/resolve
    participant S as Store

    U->>W: Pick a format
    U->>W: Add teams (one by one / paste a list / placeholders)
    W->>G: defaultSettings(format, teamCount)
    U->>W: Adjust rules (groups, legs, play-offs, points…)
    loop On every change
        W->>G: validate(format, n, settings)
        alt invalid
            G-->>W: Error message ("League phase needs an even number of teams")
        else valid
            W->>G: createTournament(dry run)
            W->>R: Resolver.progress().total
            W-->>U: "How it plays out" summary + match count
        end
    end
    U->>W: Make the draw
    W->>S: create(input)
    S->>G: createTournament(input) — shuffle, groups, fixtures, bracket
    S->>S: Prepend to tournaments, persist
    W->>W: router.replace(/t/[id])
```

## 3. Enter a score

```mermaid
sequenceDiagram
    autonumber
    actor U as Organiser
    participant T as Tournament screen
    participant M as Score entry modal
    participant R as Resolver
    participant S as Store

    U->>T: Tap a match card (or bracket tie)
    T->>M: push /t/[id]/match/[mid]
    M->>R: match(mid) → teams, leg, firstLeg, decider
    U->>M: Set the score with the steppers
    M->>R: needsPens(match, hs, as)
    alt Level in a single-leg KO, or level on aggregate in leg 2
        M-->>U: Show penalty shoot-out (must have a winner)
    end
    U->>M: Save
    M->>S: setResult(tid, mid, {hs, as, hp, ap, h, a})
    S->>S: Persist
    M->>R: new Resolver(updated).podium()
    alt Champion just decided
        M->>M: router.replace(/t/[id]/champion)
    else
        M->>M: router.back()
    end
    T->>R: useMemo recalculates tables, bracket, stage, progress
```

## 4. How a result moves teams forward

What the Resolver does when a knockout slot is read.

```mermaid
flowchart TD
    A["source(slot)"] --> K{slot.kind}
    K -->|team| T1["Return team id"]
    K -->|bye| B1["Return BYE"]
    K -->|group pos| G1{"Group finished?"}
    G1 -->|yes| G2["groupTable(g)[pos-1]"]
    G1 -->|no| N["null → shown as '1st Group A'"]
    K -->|groupPlace rank| GP{"All groups finished?"}
    GP -->|yes| GP2["placeRanking(place)[rank-1]"]
    GP -->|no| N
    K -->|table pos| L1{"League phase finished?"}
    L1 -->|yes| L2["table()[pos-1]"]
    L1 -->|no| N
    K -->|winner / loser| W1["tie(id)"]
    W1 --> W2{"Both legs valid<br/>and decided?"}
    W2 -->|yes| W3["Return winner / loser"]
    W2 -->|no| N
```

A saved score counts only if `result.h` and `result.a` still match the teams now in that slot.

## 5. Editing an earlier result

```mermaid
sequenceDiagram
    autonumber
    actor U as Organiser
    participant S as Store
    participant R as Resolver

    Note over S: SF1 was won by Team A.<br/>Final saved as A 2–1 C.
    U->>S: Change SF1 so that Team B wins
    S->>R: Recalculate
    R->>R: Final slot now has B v C
    R->>R: Saved final result has h=A ≠ B → ignored
    R-->>U: Final shows B v C, unplayed. Champion cleared
    Note over S: The old final result stays in storage.<br/>If SF1 is changed back, it becomes valid again.
```

## 6. Two-legged tie

```mermaid
stateDiagram-v2
    [*] --> Leg1Open: Both teams known
    Leg1Open --> Leg2Open: Leg 1 saved
    note right of Leg1Open: Leg 2 is locked ("Leg 1 first")
    Leg2Open --> Decided: Aggregate not level
    Leg2Open --> Decided: Aggregate level + shoot-out winner
    Leg2Open --> MissingPens: Aggregate level, no shoot-out (old leg 1 was edited)
    MissingPens --> Decided: Add shoot-out
    Decided --> [*]: Winner moves on
```

## 7. Tournament lifecycle by format

```mermaid
stateDiagram-v2
    direction LR
    state "World Cup" as WC {
      [*] --> GroupStage
      GroupStage --> Knockouts: every group finished
      Knockouts --> Final
    }
    state "Champions League" as UCL {
      [*] --> LeaguePhase
      LeaguePhase --> Playoffs: all league matches played
      Playoffs --> KO: play-off winners known
      KO --> UFinal
    }
    state "League" as LG {
      [*] --> Rounds
      Rounds --> TableDecided: all fixtures played
    }
    state "Knockout" as KOC {
      [*] --> Round1
      Round1 --> KFinal
    }
    WC --> Finished
    UCL --> Finished
    LG --> Finished
    KOC --> Finished
```
