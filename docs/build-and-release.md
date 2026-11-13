# Build & release

## 1. Local Android APK (sideloading)

Requirements: Node 20+, JDK 17+, Android SDK (platform 36, build-tools 36).

```bash
npm install
npx expo prebuild -p android          # generates android/ (git-ignored)
cd android
./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Tips:
- To build for real phones only, set `reactNativeArchitectures=armeabi-v7a,arm64-v8a` in `android/gradle.properties`.
- On machines with little memory, lower `org.gradle.jvmargs` and set `org.gradle.workers.max=2`.
- `prebuild` rewrites `android/`, so put permanent native changes in `app.json` or a config plugin.

> ⚠️ The local release build is signed with the **debug keystore**. That's fine for sharing an APK with friends, but **not accepted by Google Play**.

## 2. EAS Build (recommended for stores)

```bash
npm i -g eas-cli
eas login
eas build:configure                  # links the project to your Expo account
```

Profiles in `eas.json`:

| Profile | Output | Use |
| --- | --- | --- |
| `preview` | `.apk` | Share test builds directly |
| `production` | `.aab` (Android) / `.ipa` (iOS) | Store submission |

```bash
eas build -p android --profile preview
eas build -p android --profile production
eas build -p ios --profile production
```

EAS creates and stores the signing keys for you. **Keep the Android upload key safe.** Losing it means going through Google's key-reset process.

## 3. Google Play Store

1. Create a Google Play Console developer account (one-time fee).
2. **Create app** → name "Pitchside", default language, App, Free/Paid.
3. Complete **App content**: privacy policy URL, ads declaration, content rating questionnaire, target audience, data safety. For 1.0 the data safety answer is *no data collected or shared*, because everything stays on the device.
4. **Store listing**: short description (80 chars), full description, icon (512×512), feature graphic (1024×500), at least 2 phone screenshots (see `docs/images`).
5. Upload the `.aab` to **Internal testing** first, then Closed → Production.
   - New personal developer accounts must run a closed test with a minimum number of testers for a set period before production access. Check the current Play Console requirement.
6. Or submit straight from EAS: `eas submit -p android`.

## 4. Apple App Store

1. Join the Apple Developer Program (yearly fee).
2. In App Store Connect, create the app with bundle ID `com.calebtek.pitchside`.
3. `eas build -p ios --profile production`, then `eas submit -p ios`.
4. Fill in the privacy nutrition label (*Data Not Collected* for 1.0), screenshots for the required iPhone sizes, a description and a support URL.
5. Test with TestFlight, then submit for review.

## 5. Direct APK release (automated)

The workflow `.github/workflows/release-apk.yml` builds and publishes the APK on GitHub's servers:

1. Raise `version` / `versionCode` in `app.json`.
2. Update `.github/release-notes.md` with what's new.
3. Commit, then tag and push:
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```
4. The workflow runs tests, builds the APK and creates the GitHub Release with **`Pitchside.apk`** attached. The website's download button (`releases/latest/download/Pitchside.apk`) picks it up automatically.

You can also run it manually from the **Actions** tab (*Run workflow*). That produces the APK as a downloadable build artifact without creating a release.

See [distribution.md](distribution.md) for every store.

## 6. Versioning

| Field | Where | Rule |
| --- | --- | --- |
| `version` | `app.json` → `expo.version` | User-facing, semantic version (`1.1.0`) |
| `android.versionCode` | `app.json` | Integer, **must increase** with every Play upload |
| `ios.buildNumber` | `app.json` | Increase with every App Store upload |

Tag releases in git: `git tag v1.1.0 && git push --tags`.

## 7. Pre-release checklist

- [ ] `npm test` and `npm run typecheck` pass
- [ ] Manual checklist in [testing.md](testing.md) done on a real device
- [ ] Version and versionCode raised
- [ ] Release notes written
- [ ] Privacy policy published (needed for both stores)
- [ ] If the stored data format changed, a persist `migrate` was added ([data-model.md](data-model.md))
