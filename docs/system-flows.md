# System flows

Step-by-step views of the main user journeys.

## 1. App launch

<!-- diagram:flow-launch -->
![flow-launch](diagrams/flow-launch.png)

<details><summary>Mermaid source (<code>diagrams/src/flow-launch.mmd</code>)</summary>

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

</details>
<!-- /diagram -->

## 2. Create a tournament

<!-- diagram:flow-create -->
![flow-create](diagrams/flow-create.png)

<details><summary>Mermaid source (<code>diagrams/src/flow-create.mmd</code>)</summary>

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

</details>
<!-- /diagram -->

## 3. Enter a score

<!-- diagram:flow-score-entry -->
![flow-score-entry](diagrams/flow-score-entry.png)

<details><summary>Mermaid source (<code>diagrams/src/flow-score-entry.mmd</code>)</summary>

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

</details>
<!-- /diagram -->

## 4. How a result moves teams forward

What the Resolver does when a knockout slot is read.

<!-- diagram:flow-source-resolution -->
![flow-source-resolution](diagrams/flow-source-resolution.png)

<details><summary>Mermaid source (<code>diagrams/src/flow-source-resolution.mmd</code>)</summary>

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

</details>
<!-- /diagram -->

A saved score counts only if `result.h` and `result.a` still match the teams now in that slot.

## 5. Editing an earlier result

<!-- diagram:flow-edit-result -->
![flow-edit-result](diagrams/flow-edit-result.png)

<details><summary>Mermaid source (<code>diagrams/src/flow-edit-result.mmd</code>)</summary>

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

</details>
<!-- /diagram -->

## 6. Two-legged tie

<!-- diagram:flow-two-legged-tie -->
![flow-two-legged-tie](diagrams/flow-two-legged-tie.png)

<details><summary>Mermaid source (<code>diagrams/src/flow-two-legged-tie.mmd</code>)</summary>

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

</details>
<!-- /diagram -->

## 7. Tally draw (random clubs for players)

Players each pick a colour tally. Each tally then spins and lands on a random club from the pool, so nobody gets to keep their usual team.

<!-- diagram:flow-tally-draw -->
![flow-tally-draw](diagrams/flow-tally-draw.png)

<details><summary>Mermaid source (<code>diagrams/src/flow-tally-draw.mmd</code>)</summary>

```mermaid
sequenceDiagram
    autonumber
    actor P as Players
    participant W as Create wizard
    participant T as TallyDraw
    participant K as ClubPicker / catalogue
    participant D as engine/draw

    W->>T: Open with current teams as the club pool
    opt Pool too small
        T->>K: Add clubs (search, league filter, packs)
        K-->>T: Selected PresetClubs
    end
    loop For each player
        P->>T: Name + pick a free colour tally
    end
    P->>T: Clubs per player (1–4, limited by pool size)
    T->>T: Go to the draw (needs ≥ 2 players and pool ≥ players × clubs)
    loop Tap a tally (or "Draw all" queues every tally, round by round)
        T->>D: pickRandom(pool, alreadyDrawn)
        D-->>T: Final club
        T->>T: Spin animation cycles random names, slows, lands on final club
    end
    P->>T: Use these teams
    T-->>W: Team[] (club name + short, player name, tally colour)
    W->>W: Replace the team list, continue to rules
```

</details>
<!-- /diagram -->

## 8. Tournament lifecycle by format

<!-- diagram:flow-lifecycle -->
![flow-lifecycle](diagrams/flow-lifecycle.png)

<details><summary>Mermaid source (<code>diagrams/src/flow-lifecycle.mmd</code>)</summary>

```mermaid
flowchart LR
    subgraph WC ["World Cup"]
      direction LR
      w1["Group stage"] -->|"every group finished"| w2["Knockouts"] --> w3["Final"]
    end
    subgraph UCL ["Champions League"]
      direction LR
      u1["League phase"] -->|"all league matches played"| u2["Play-offs"] -->|"winners known"| u3["Knockouts"] --> u4["Final"]
    end
    subgraph LG ["League"]
      direction LR
      l1["Matchdays"] -->|"all fixtures played"| l2["Table decided"]
    end
    subgraph KO ["Knockout Cup"]
      direction LR
      k1["First round<br/>(byes auto-advance)"] --> k2["…"] --> k3["Final"]
    end
    done(["🏆 Finished<br/>champion screen"])
    w3 --> done
    u4 --> done
    l2 --> done
    k3 --> done

    classDef s fill:#1F2B50,stroke:#5B8CFF,color:#fff
    classDef f fill:#FFC93C,stroke:#E09A12,color:#3A2500
    class w1,w2,w3,u1,u2,u3,u4,l1,l2,k1,k2,k3 s
    class done f
```

</details>
<!-- /diagram -->
