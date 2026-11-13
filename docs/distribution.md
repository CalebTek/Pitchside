# Distribution

Where Pitchside can be published, what each store needs, and the recommended order. Store rules change often, so check each console's current requirements before you submit.

## At a glance

| Channel | Cost | Individual account? | Notes |
| --- | --- | --- | --- |
| **Direct APK** (website + GitHub Releases) | Free | Yes | Live now. Android's developer verification will make sideloading stricter from 2027 |
| **Google Play** | One-time ~$25 | Yes | New personal accounts must run a **12-tester, 14-day closed test** before production |
| **Huawei AppGallery** | Free | Yes (ID + bank card verification) | Reaches Huawei phones without Google services. Pitchside has no Google Play services dependency, so it runs as-is |
| **Palm Store** (Tecno / Infinix / itel) | Partnership | Via Transsion | Preinstalled on the most popular phone brands in Nigeria and much of Africa |
| **Samsung Galaxy Store** | Free | ⚠️ Effectively no | Android apps need *commercial seller status*, which asks for a company **D-U-N-S number** |
| **Apple App Store** | $99 / year | Yes | Needs EAS (no Mac required). Enrollment payments from Nigeria are often difficult |
| ~~Amazon Appstore~~ | — | — | Closed on Android phones in August 2025 |

## Recommended order

```
1. Direct APK on the website ................ live now
2. Google Play closed test (14 days) ........ start immediately, invite the game-night group
3. Huawei AppGallery ........................ in parallel; free, same APK
4. Google Play production ................... after the closed test
5. Palm Store ............................... apply once Play is live (store rating & installs help)
6. Samsung / Apple .......................... when there's a registered company or revenue
```

---

## 1. Direct APK

**Website:** https://calebtek.github.io/Pitchside/. It's hosted on GitHub Pages from the `gh-pages` branch.
**Download link** (always the newest release): `https://github.com/CalebTek/Pitchside/releases/latest/download/Pitchside.apk`

To publish a new version, raise the version in `app.json`, push, then run **Actions → Release APK → Run workflow** on GitHub. The action builds the APK and attaches it to the release as `Pitchside.apk`, which is the name the website's download button points at. Details in [build-and-release.md](build-and-release.md#5-direct-apk-release-automated).

> ⚠️ The direct APK is signed with a different key from the Play Store version. Users who later switch to the Play version must uninstall the APK first. Their tournaments are stored on the phone and will be lost.

## 2. Google Play

**Everything for the listing is in [`/store`](../store/README.md):** text, icon, feature graphic, screenshots, data-safety and content-rating answers, and the tester invite.

1. Create a developer account at play.google.com/console. Choose **Personal**, pay the fee and verify your ID and phone.
2. **Create app**: name *Pitchside*, App, Free.
3. **App content**: privacy policy URL `https://calebtek.github.io/Pitchside/privacy.html`, then data safety, content rating, target audience, ads = No (answers in `/store`).
4. **Main store listing**: paste the text and upload the graphics.
5. Build the bundle: `eas build -p android --profile production`. Let EAS create the upload key, and keep your Expo account safe because it holds the key.
6. **Testing → Closed testing** → create a track → upload the `.aab` → add testers (an email list or Google Group).
7. Send the invite message in `/store/README.md`. You need **at least 12 testers opted in for 14 continuous days**, and they should actually open the app.
8. Day 15+: **Apply for production access**, then answer Google's questions about the test.
9. Create a production release with the "What's new" text and roll out.

Tips:
- Ask 15–20 people, not exactly 12. Some will leave the test, and if the count drops below 12 the 14 days start again.
- Use a Google Group as the tester list. People join it with one tap.
- An **organisation** account (for example under Cryostar Technology) skips the 12-tester rule, but it needs a D-U-N-S number, which can take weeks.

## 3. Huawei AppGallery

1. Create a HUAWEI ID at developer.huawei.com, then complete **individual identity verification** (ID document + bank card). Review usually takes 1–2 working days. ⚠️ You can't change the account type or country later.
2. **AppGallery Connect → My apps → New app**: Android, package `com.calebtek.pitchside`, category Sports.
3. Upload a signed APK, reuse the `/store` text and graphics, add the privacy policy URL, and choose the age rating (3+).
4. Submit for review.

Pitchside doesn't use Google Play services, so it works on Huawei phones without changes.

## 4. Palm Store (Transsion: Tecno, Infinix, itel)

Palm Store comes preinstalled on Tecno, Infinix and itel phones, which are the best-selling brands in Nigeria. For a local game-night app, this could be the biggest channel after Play.

- Publishing happens through Transsion's business arm (Dlightek). There's no simple self-serve console like Play's.
- Approach: contact them through dlightek.com (Business → Palm Store / app distribution) with the app summary, the feature graphic, the Play Store link and install numbers.
- Having the app live on Play with good ratings first makes this conversation easier.

## 5. Samsung Galaxy Store

To distribute any Android app, even a free one, you need **commercial seller status**. For apps that requires a **D-U-N-S number**. Plan this together with an organisation Play account if a company becomes the publisher. Once approved, Seller Portal can **import the listing from Google Play**.

## 6. Apple App Store

1. Enroll in the Apple Developer Program as an **individual**. Use your exact legal name and your own credit card. Payment failures from Nigerian cards are common, so a USD card from a different bank sometimes works.
2. `eas build -p ios --profile production` → `eas submit -p ios`.
3. App Store Connect: privacy label *Data Not Collected*, screenshots for the required iPhone sizes, support URL (the website), review.
4. Test with TestFlight first.

---

## Before every store submission

- [ ] Version and `versionCode` raised in `app.json`
- [ ] `npm test` and `npm run typecheck` pass
- [ ] Manual checklist in [testing.md](testing.md) done on a real phone
- [ ] Permissions still minimal: `INTERNET` and `VIBRATE` only (unused template permissions are blocked in `app.json`)
- [ ] If data handling changed (accounts, sync, ads, purchases): update the privacy policy, data safety and the App Store privacy label **before** release

## Content and trademark notes

- The listing doesn't name third-party games or leagues, to avoid trademark rejections. It says "football game nights" instead.
- The app contains real club and national-team **names and colours only** (no crests or logos). If a store reviewer objects, the preset catalogue can be shipped as generic names in a store-specific build.
