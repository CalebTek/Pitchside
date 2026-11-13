# Design system

Pitchside uses a dark, stadium-at-night look: deep navy surfaces, mint-green for actions and gold for anything to do with trophies. Tokens live in `src/theme/index.ts` and components in `src/components/ui.tsx`.

## Colour tokens (`C`)

| Token | Hex | Use |
| --- | --- | --- |
| `bg` | `#0A0F1E` | App background, splash, adaptive icon background |
| `bg2` | `#0E1530` | Secondary background |
| `surface` | `#131B33` | Inputs, segmented controls, played match cards |
| `card` | `#18223F` | Cards |
| `cardHi` | `#1F2B50` | Pressed / selected cards, stepper buttons |
| `line` | `#26335C` | Borders, dividers, bracket connectors |
| `text` | `#F2F5FF` | Primary text |
| `sub` | `#9AA5C8` | Secondary text |
| `dim` | `#5F6A8F` | Hints, placeholders, TBD |
| `mint` / `mintDeep` | `#3DF5A7` / `#12B97A` | Primary actions, winners, "qualified" zone |
| `gold` / `goldDeep` | `#FFC93C` / `#E09A12` | Trophy, champion, finals, penalties |
| `blue` | `#5B8CFF` | Play-off zone, information notices |
| `red` | `#FF5C7A` | Errors, losses, destructive actions |

### Format gradients

| Format | Gradient |
| --- | --- |
| World Cup | `#12B97A → #0A6E8F` |
| Champions League | `#3B4BD8 → #141B6B` |
| League | `#9B7CFF → #4B2A9E` |
| Knockout | `#FF7A45 → #B0244B` |

### Tally colours

Defined in `src/engine/draw.ts` as `TALLIES`: Red `#FF4D5E`, Blue `#4C7DFF`, Green `#2EE07A`, Gold `#FFC93C`, Purple `#A77BFF`, Orange `#FF8A3D`, Pink `#FF6BD6`, Cyan `#2ED3F0`, White `#F2F5FF`, Lime `#C6F24E`, Teal `#19C2A0`, Coral `#FF8F7A`, Sky `#7FB2FF`, Bronze `#D19A66`, Silver `#AEB7CF`, Magenta `#E040FB`. They're all bright enough to read on the dark background, and the drawn teams use them as their badge colour.

### Table zones

| Zone | Colour |
| --- | --- |
| Qualified / straight to the knockouts / champion | mint |
| Play-off places | blue |
| Best 3rd-placed teams | gold |

## Typography (`F`)

| Role | Font | Typical size |
| --- | --- | --- |
| Display (titles, scores, buttons) | Barlow Condensed 800 / 700 / 600, often uppercase | 18–84 |
| Body | Inter 400 / 500 / 600 / 700 | 11–16 |
| Labels | Inter 600, uppercase, letter-spacing 1.2–1.6 | 10–12 |

## Radii (`R`)

`sm 10 · md 16 · lg 22 · xl 28`. Cards use `lg`, buttons and inputs use `md`/14.

## Components

| Component | Notes |
| --- | --- |
| `T` | Text with variants `h1 h2 h3 body small label score` |
| `Button` | `primary` (mint gradient), `gold`, `danger`, `ghost`. Height 54, medium haptic |
| `IconButton` | 42×42 rounded square |
| `Chip` | Tinted pill (`color + 22` fill, `+55` border) |
| `TeamBadge` | Rounded square showing the team's `short` code (or initials) in its colour. `?` when TBD |
| `ClubPicker` | Full-screen sheet: search, gold pack chips, league chips, checkable rows, pinned add button |
| `TallyDraw` | Players & tally palette → grid of tally cards with a spin reveal |
| `Segmented` | Tab control. The active tab is filled mint |
| `Stepper` | Compact horizontal, or `big` vertical (+ / number / −) for score entry |
| `Toggle` | Row with label, hint and a custom switch |
| `Progress` | 6 px bar |
| `MatchCard` | Teams, score or "Score" call-to-action, penalties, aggregate, warnings |
| `StandingsTable` | Zone stripe, form bars, P W D L GD Pts |
| `Bracket` / `TieCard` | Columns whose spacing doubles each round. Connectors drawn with absolute-positioned lines |

## Icon & splash

- The icon is a gold trophy with a mint ring on a navy gradient. Sources: `assets/icon.png`, `android-icon-foreground.png` and `android-icon-monochrome.png` (Android 13+ themed icons).
- The splash is the trophy on `#0A0F1E`.

## Guidelines

- One mint primary action per screen, pinned to the bottom when it's the main action.
- Gold is only for trophies, finals and penalties. Don't use it for general emphasis.
- Every tappable thing gives haptic feedback through `tap()`.
- Use `confirm()` / `notify()` from `components/confirm.ts`, not `Alert` directly. They also work on web.
