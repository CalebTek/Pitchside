# Store kit

Everything you need to fill in a Google Play listing. Samsung, Huawei and Palm Store ask for almost the same things, so you can reuse it there. See [docs/distribution.md](../docs/distribution.md) for the step-by-step process for each store.

| Item | File / value |
| --- | --- |
| App icon (512×512, 32-bit PNG) | [`graphics/icon-512.png`](graphics/icon-512.png) |
| Feature graphic (1024×500) | [`graphics/feature-graphic-1024x500.png`](graphics/feature-graphic-1024x500.png) |
| Phone screenshots (1080×1920, 9:16) | [`screenshots/`](screenshots/): 8 images, upload them in order |
| Privacy policy URL | https://calebtek.github.io/Pitchside/privacy.html |
| Website | https://calebtek.github.io/Pitchside/ |
| Support / contact | https://github.com/CalebTek/Pitchside/issues (add your support email in the console) |
| Package name | `com.calebtek.pitchside` |
| Category | Sports |
| Tags | Sports, Tournament, Football, Soccer |
| Price | Free |
| Contains ads | No |
| In-app purchases | No |

---

## Listing text

### App name (max 30)
```
Pitchside: Football Tournament
```

### Short description (max 80)
```
World Cup & Champions League style tournaments for your game nights. Offline.
```

### Full description (max 4000)
```
Pitchside brings cup competitions back to your football game nights.

Set up a tournament, play your matches on the console, type in the scores and let Pitchside do the rest. Tables, tie-breakers, qualification, brackets, two-legged aggregates, penalty shoot-outs and the champion are all handled for you.

FOUR FORMATS
• World Cup: draw teams into groups, the top teams go through to a knockout bracket. Optional best third-placed teams and a third-place match.
• Champions League style: the new league phase where everyone plays a set number of different opponents in one big table. The top seeds go straight through, the next group fight it out in knockout play-offs, then two-legged ties and a one-off final.
• League: single or home-and-away round robin.
• Knockout Cup: a seeded bracket, with byes handed out automatically.

FAST SETUP
• 100+ preset clubs and national teams with search, league filters and one-tap packs.
• Paste a whole list of teams at once, or add them one by one.
• Add each player's name next to their club.

TALLY DRAW
Tired of friends always picking the same team? Each player picks a colour tally, then the app spins and lands them on a random club. Hand out up to four clubs per player.

SMART RULES
• Points, goal difference, goals scored, wins and head-to-head.
• Aggregate scores over two legs, with penalties when it's level.
• Edit an old score and every table and bracket updates instantly.
• Configurable points for a win and a draw.

BUILT FOR GAME NIGHTS
• Works fully offline. No account, no sign-up, no data costs.
• Big score buttons with haptic feedback.
• A champion celebration with podium and the winner's record.

Your tournaments stay on your phone. Pitchside does not collect any personal data.
```

### What's new (release notes, max 500)
```
Version 1.1
• 100+ preset clubs and national teams with search, filters and quick packs
• Tally draw: players pick a colour and get random clubs with a spin reveal
• 3-letter club codes on badges
```

---

## Data safety form (Google Play)

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | Not applicable (no data collected) |
| Do you provide a way for users to request that their data is deleted? | Not applicable. All data stays on the device; uninstalling the app or using "Delete tournament" removes it |

Pitchside makes no network requests and has no analytics, ads or crash-reporting SDKs. The APK requests only `INTERNET` (declared by React Native, not used at runtime) and `VIBRATE` (haptic feedback). Unused template permissions are blocked in `app.json`.

## Content rating questionnaire (IARC)

| Section | Answer |
| --- | --- |
| Category | Utility, productivity, communication or other (not a game: users record real-life match results) |
| Violence, sexuality, language, drugs | No |
| Gambling or simulated gambling | **No** (the tally draw only assigns clubs; there are no stakes, coins or prizes) |
| User-generated content shared with others / user interaction | No |
| Shares location / personal info | No |
| Digital purchases | No |

Expected rating: **Everyone / PEGI 3**.

## App access, ads and audience

| Field | Answer |
| --- | --- |
| App access | All functionality is available without special access |
| Ads | No ads |
| Target audience | 13+ (avoid selecting under-13 age groups unless you want to follow the Families policy) |
| News app | No |
| Government app | No |
| Financial features | None |
| Health | None |

---

## Closed test invite (WhatsApp / message)

Replace the two links once your closed test is created in Play Console. You'll find them under *Testing → Closed testing → Testers*.

```
⚽🏆 PITCHSIDE BETA — I need you for 14 days!

I've built Pitchside, an app for running our own World Cup / Champions League tournaments on game nights: groups, league phase, brackets, penalties, and a random "tally draw" so nobody keeps their favourite team.

To get it on the Play Store, Google needs 12 testers using it for 14 days straight. Takes 1 minute:

1️⃣ Join the tester list with your Gmail: <GOOGLE GROUP OR EMAIL LIST LINK>
2️⃣ Accept the invite and install: <PLAY TESTING OPT-IN LINK>
3️⃣ Keep it installed for 14 days and open it a few times — set up a quick cup, enter some scores 😄

Please DON'T uninstall or leave the test before the 14 days are up, or the countdown restarts.

Any bugs or ideas, just reply here. Thank you! 🙏
```

## Release checklist

- [ ] Build the Play bundle: `eas build -p android --profile production` (EAS creates the upload key)
- [ ] Create app in Play Console, fill **App content** with the answers above
- [ ] Upload store listing text, icon, feature graphic, screenshots
- [ ] Closed testing track → upload `.aab` → add testers → send the invite
- [ ] After 14 days with 12+ testers: apply for production access
- [ ] Production release with the "What's new" text
