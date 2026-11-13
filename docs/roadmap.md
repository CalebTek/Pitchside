# Roadmap

Status: ✅ done · 🔜 next · 💡 idea

## 1.0 — Core ✅

- ✅ World Cup, Champions League (league phase + play-offs), League and Knockout formats
- ✅ Automatic tables, tie-breakers, progression, byes, aggregates, penalties
- ✅ Editing a score updates everything downstream
- ✅ Offline storage, champion celebration screen

## 1.1 — Faster setup ✅

- ✅ Preset club catalogue (105 clubs & national teams) with search, league filters and one-tap packs
- ✅ Tally draw: players pick colour tallies and each gets random clubs with a spin reveal
- ✅ 3-letter badge codes (MCI, MUN…) for preset clubs

## Feature ideas

| Feature | Value | Notes |
| --- | --- | --- |
| 💡 Share table / bracket as an image | Groups share results on WhatsApp | `react-native-view-shot` + share sheet |
| 💡 Goal scorers & player stats | Golden Boot, assists, clean sheets | Extend `Result` with scorer events |
| 💡 Club crests / custom colours | More personal | Image picker; store as files, not inside the JSON |
| 💡 Custom tournament formats | Copa América style, Euro 24 | New format branches in the engine |
| 💡 Fixture scheduling | Dates and kick-off times, reminders | `expo-notifications` |
| 💡 Export / import tournaments | Backups, move to a new phone | JSON file through the share sheet |
| 💡 Head-to-head & history | All-time records across tournaments | Link teams to a persistent player profile |
| 💡 Cloud sync & shared viewing | Players follow live on their own phones | Needs a backend (for example Supabase or Firebase) and accounts |
| 💡 Light theme | Easier to read in daylight | Theme tokens are already in one place |

## Monetisation options

| Model | How it could work |
| --- | --- |
| **Freemium (one-off unlock)** | Free: 1–2 active tournaments, basic formats. Pro: unlimited tournaments, all formats, image sharing, stats |
| **Subscription** | Pairs well with cloud sync, live shared viewing and online leagues, which have running costs |
| **Ads** | A banner on the home screen only, never during score entry. A "remove ads" purchase |
| **Organiser / venue tier** | For gaming lounges and viewing centres running paid tournaments: branding, entry-fee tracking, printable brackets |

Technical notes:
- In-app purchases: `react-native-iap` or RevenueCat. Both need a development build or EAS, not Expo Go.
- Adding ads or accounts changes the Play **Data safety** form and the App Store privacy label.
- Keep the engine free and pure. Paid features should live in the presentation and service layers.
