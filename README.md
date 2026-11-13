# Pitchside

Run local football tournaments (World Cup, Champions League, League, Knockout Cup) for eFootball / FIFA nights. You type in the scores yourself. The app works out the tables, who goes through, the bracket and the champion.

Built with **Expo (React Native) + TypeScript**: one codebase runs on Android and iOS. Everything is stored on the phone, so there's no server and no login, and it works offline.

## Formats

| Format | How it plays out |
| --- | --- |
| **World Cup** | Random or seeded draw into groups → top 1–4 per group (plus optional best 3rd-placed teams) → knockout bracket. With 2 per group and 2/4/8 groups it uses the classic A1 v B2 crossover, so group-mates can only meet in the final. Optional third-place match. |
| **Champions League** | Swiss-style **league phase**: one table, every team plays *N* different opponents. Top *K/2* go straight to the knockouts, the next *K* play **knockout play-offs** (9th v 24th, 10th v 23rd…), and the rest are out. Then two-legged ties with a one-off final. |
| **League** | Single or double round robin. Top of the table wins. |
| **Knockout Cup** | Seeded bracket. Byes go to the top seeds automatically when the numbers don't fit. |

Common rules:
- Two-legged ties are decided on aggregate. A penalty shoot-out is asked for when the aggregate is level (no away goals).
- Single-leg knockout draws also ask for penalties.
- Table tie-breakers, in order: points → goal difference → goals scored → wins → head-to-head.
- Points for a win/draw are configurable.
- If you edit an earlier score, any later knockout result that no longer has the same teams is voided automatically.

## Project layout

```
src/
  engine/      pure TypeScript tournament logic (draws, fixtures, tables, progression) + tests
  store/       zustand store persisted to AsyncStorage
  components/  UI building blocks (match card, standings table, bracket…)
  app/         screens (expo-router)
```

## Run it

```bash
npm install
npm test            # engine tests
npx expo start      # scan the QR code with the Expo Go app on your phone
```

## Build installable apps

**Android APK (local):**
```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

**Android/iOS with EAS (cloud, no Mac needed for iOS):**
```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview   # APK you can share
eas build -p ios                         # needs an Apple Developer account
```

> The local release build is signed with the debug keystore, which is fine for sideloading. For the Play Store, create your own upload key or use EAS to manage signing.
