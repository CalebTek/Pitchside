# C4 model

The [C4 model](https://c4model.com) describes software at four zoom levels: **Context → Containers → Components → Code**.

Pitchside 1.0 is a standalone, offline mobile app. Levels 1 and 2 are therefore small. Most of the interesting structure is at levels 3 and 4.

---

## Level 1 — System context

Who uses Pitchside and what it talks to.

<!-- diagram:c4-1-context -->
![c4-1-context](diagrams/c4-1-context.png)

<details><summary>Mermaid source (<code>diagrams/src/c4-1-context.mmd</code>)</summary>

```mermaid
flowchart TB
    organiser(["👤 <b>Tournament organiser</b><br/>Sets up competitions and<br/>enters scores after each game"])
    players(["👥 <b>Players / spectators</b><br/>Look at tables, fixtures and<br/>the bracket on the organiser's phone"])

    subgraph boundary [" "]
      pitchside["📱 <b>Pitchside</b><br/>Mobile app that runs World Cup,<br/>Champions League, league and<br/>knockout competitions"]
    end

    console["🎮 <b>Game console</b><br/>eFootball / EA FC<br/>(where matches are actually played)"]
    stores["🏪 <b>App stores</b><br/>Google Play / Apple App Store<br/>(distribution)"]

    organiser -- "Creates tournaments,<br/>enters results" --> pitchside
    players -- "View standings<br/>and bracket" --> pitchside
    organiser -. "Plays matches on" .-> console
    stores -- "Installs & updates" --> pitchside

    classDef person fill:#12B97A,stroke:#0b7a52,color:#fff
    classDef system fill:#1F2B50,stroke:#3DF5A7,color:#fff
    classDef ext fill:#5F6A8F,stroke:#3c4566,color:#fff
    class organiser,players person
    class pitchside system
    class console,stores ext
    style boundary fill:none,stroke:none
```

</details>
<!-- /diagram -->

**Key point:** the console and Pitchside are not connected. The organiser enters scores by hand, which is why the app works with any football game.

---

## Level 2 — Containers

A container is anything that runs code or stores data on its own.

<!-- diagram:c4-2-containers -->
![c4-2-containers](diagrams/c4-2-containers.png)

<details><summary>Mermaid source (<code>diagrams/src/c4-2-containers.mmd</code>)</summary>

```mermaid
flowchart TB
    user(["👤 Organiser"])

    subgraph device ["📱 User's phone (Android / iOS)"]
      direction TB
      app["<b>Pitchside app</b><br/><i>React Native 0.88 · Expo SDK 58 · TypeScript</i><br/>UI, navigation, tournament engine"]
      storage[("<b>AsyncStorage</b><br/><i>On-device key–value store</i><br/>Key: pitchside-v1<br/>JSON of all tournaments")]
    end

    eas["☁️ <b>EAS Build</b><br/><i>Expo cloud service</i><br/>Compiles .apk / .aab / .ipa"]
    stores["🏪 <b>Play Store / App Store</b>"]

    user -- "Taps, enters scores" --> app
    app -- "Reads and writes JSON<br/>(zustand persist)" --> storage
    eas -- "Produces signed binaries" --> stores
    stores -- "Installs" --> app

    classDef c fill:#1F2B50,stroke:#3DF5A7,color:#fff
    classDef db fill:#18223F,stroke:#FFC93C,color:#fff
    classDef ext fill:#5F6A8F,stroke:#3c4566,color:#fff
    class app c
    class storage db
    class eas,stores ext
```

</details>
<!-- /diagram -->

| Container | Technology | Responsibility |
| --- | --- | --- |
| Pitchside app | React Native, Expo, TypeScript, Hermes JS engine | Everything the user sees and every tournament calculation |
| AsyncStorage | Native key–value store (SQLite on Android, files on iOS) | Keeps tournaments between app launches |
| EAS Build *(build time only)* | Expo cloud | Produces signed store binaries |

> There is **no backend** in 1.0. A cloud sync or account service would be a new container. See the [roadmap](roadmap.md).

---

## Level 3 — Components (inside the app)

<!-- diagram:c4-3-components -->
![c4-3-components](diagrams/c4-3-components.png)

<details><summary>Mermaid source (<code>diagrams/src/c4-3-components.mmd</code>)</summary>

```mermaid
flowchart LR
    subgraph ui ["Presentation — src/app + src/components"]
      direction TB
      router["<b>Router</b><br/>_layout.tsx · expo-router Stack"]
      subgraph screens ["Screens"]
        direction TB
        home["Home<br/>index.tsx"]
        wizard["Create wizard<br/>new.tsx"]
        tscreen["Tournament<br/>t/[id]/index.tsx"]
        entry["Score entry (modal)<br/>t/[id]/match/[mid].tsx"]
        champ["Champion<br/>t/[id]/champion.tsx"]
      end
      subgraph sheets ["Wizard sheets"]
        direction TB
        picker["<b>ClubPicker</b><br/>search · leagues · packs"]
        tally["<b>TallyDraw</b><br/>colour tallies · spin reveal"]
      end
      kit["<b>UI kit</b><br/>ui.tsx · MatchCard<br/>StandingsTable · Bracket<br/>+ theme"]
      router --> screens
      wizard --> sheets
      screens --> kit
      sheets --> kit
    end

    catalogue["<b>Club catalogue</b><br/>src/data/clubs.ts<br/>105 clubs & nations · packs"]

    subgraph state ["State — src/store"]
      direction TB
      store["<b>useStore</b> (Zustand)<br/>create · setResult · clearResult<br/>renameTeam · resetResults · remove"]
      persist["persist middleware"]
      store --> persist
    end

    subgraph engine ["Domain — src/engine (pure TS)"]
      direction TB
      gen["<b>generate.ts</b><br/>defaultSettings · validate<br/>createTournament · buildBracket"]
      res["<b>resolve.ts</b><br/>Resolver: tables, sources, ties,<br/>matches, podium, progress"]
      draw["<b>draw.ts</b><br/>TALLIES · pickRandom · drawAll"]
      types["<b>types.ts</b>"]
      gen --> types
      res --> types
    end

    disk[("AsyncStorage")]

    sheets --> catalogue
    tally -- "pickRandom()" --> draw
    screens -- "read tournaments ·<br/>dispatch actions" --> store
    screens -- "new Resolver(t)<br/>validate()" --> engine
    store -- "createTournament()" --> gen
    persist -- "JSON" --> disk

    classDef l1 fill:#1F2B50,stroke:#5B8CFF,color:#fff
    classDef l2 fill:#18223F,stroke:#9B7CFF,color:#fff
    classDef l3 fill:#0E3B2E,stroke:#3DF5A7,color:#fff
    classDef data fill:#3A2A00,stroke:#FFC93C,color:#fff
    class router,home,wizard,tscreen,entry,champ,kit,picker,tally l1
    class store,persist l2
    class gen,res,draw,types l3
    class catalogue data
```

</details>
<!-- /diagram -->

### Component responsibilities

| Component | File(s) | Responsibility |
| --- | --- | --- |
| Router | `src/app/_layout.tsx` | Loads fonts, keeps the splash screen up until they're ready, sets the dark theme, declares the stack and the modal routes |
| Home | `src/app/index.tsx` | Lists tournaments with stage, progress and champion. Shows format tiles on first launch |
| Create wizard | `src/app/new.tsx` | Three steps: format → teams → rules. Checks the setup live and previews the structure |
| Tournament screen | `src/app/t/[id]/index.tsx` | Tabs for tables or groups, filtered match list, bracket and play-offs, and team renaming. Menu to clear scores or delete |
| Score entry | `src/app/t/[id]/match/[mid].tsx` | Score steppers, aggregate view, penalty shoot-out when needed. Goes to the champion screen when a result decides the final |
| Champion | `src/app/t/[id]/champion.tsx` | Trophy animation, confetti, champion's record, runner-up and third place |
| UI kit | `src/components/*` | Shared building blocks and the bracket layout |
| Store | `src/store/index.ts` | The single source of truth for saved data. Holds only *inputs* (setup and results) |
| Generator | `src/engine/generate.ts` | Turns a setup into fixtures and a knockout skeleton |
| Resolver | `src/engine/resolve.ts` | Works out *everything else* from the inputs: standings, who fills each slot, winners, the podium |

---

## Level 4 — Code (engine core)

The most important classes and types. See [data-model.md](data-model.md) for every field.

<!-- diagram:c4-4-code -->
![c4-4-code](diagrams/c4-4-code.png)

<details><summary>Mermaid source (<code>diagrams/src/c4-4-code.mmd</code>)</summary>

```mermaid
classDiagram
    direction LR
    class Tournament {
      +string id
      +string name
      +Format format
      +Team[] teams
      +Settings settings
      +string[][] groups
      +Fixture[] fixtures
      +KoRound[] ko
      +ResultMap results
    }
    class Fixture {
      +string id
      +string stage
      +number round
      +number group
      +string home
      +string away
    }
    class KoRound {
      +string id
      +string name
      +boolean twoLegs
      +Tie[] ties
      +boolean isPlayoff
      +boolean isThirdPlace
    }
    class Tie {
      +string id
      +Source a
      +Source b
    }
    class Source {
      <<union>>
      +team
      +bye
      +group pos
      +groupPlace rank
      +table pos
      +winner tie
      +loser tie
    }
    class Result {
      +number hs
      +number as
      +number hp
      +number ap
      +string h
      +string a
      +number at
    }
    class Team {
      +string id
      +string name
      +string player
      +string short
      +string color
    }
    class Resolver {
      +table() Row[]
      +groupTable(g) Row[]
      +source(Source) teamId
      +tie(id) TieView
      +matches() MatchView[]
      +podium()
      +progress()
      +stageLabel()
      +needsPens(m, hs, as)
    }
    Tournament "1" *-- "*" Team
    Tournament "1" *-- "*" Fixture
    Tournament "1" *-- "*" KoRound
    KoRound "1" *-- "*" Tie
    Tie "1" *-- "2" Source
    Tournament "1" *-- "*" Result : keyed by match id
    Resolver ..> Tournament : reads (never mutates)
```

</details>
<!-- /diagram -->

**Design rule:** a `Tournament` stores *what happened* (the setup and the scores). It never stores *what follows from it* (tables, qualifiers, winners). The `Resolver` recalculates those every time. Because of this, editing any score automatically corrects everything downstream. See [ADR-002](adr/002-derive-state-dont-store-it.md).
