# Tech stack

| Area | Package | Version | Why |
| --- | --- | --- | --- |
| Framework | `expo` | ~58 | Managed native setup, OTA-ready, EAS builds, Expo Go for instant testing |
| Runtime | `react-native` | 0.88 | New Architecture (Fabric/TurboModules) and Hermes for fast start-up |
| UI library | `react` | 19 | Latest React features |
| Language | TypeScript | strict | Safety in the rules engine, where bugs would mean wrong winners |
| Navigation | `expo-router` | ~58 | File-based routes, native stack, typed routes, deep links |
| Native screens | `react-native-screens`, `react-native-safe-area-context` | — | Native navigation containers, notch and home-indicator safe areas |
| State | `zustand` | ^5 | Tiny, no boilerplate, built-in `persist` |
| Storage | `@react-native-async-storage/async-storage` | 2.x | Simple, reliable on-device persistence |
| Gradients | `expo-linear-gradient` | — | Hero headers, buttons, format tiles |
| Haptics | `expo-haptics` | — | Tactile feedback on score entry |
| Fonts | `expo-font`, `@expo-google-fonts/barlow-condensed`, `@expo-google-fonts/inter` | — | Sporty display type with a clean body font, bundled for offline use |
| Icons | `@expo/vector-icons` (MaterialCommunityIcons) | — | Trophy, football and bracket icons |
| Splash / system UI | `expo-splash-screen`, `expo-system-ui`, `expo-status-bar` | — | Branded launch, dark system bars |
| Web (dev preview) | `react-native-web`, `react-dom` | — | Run the app in a browser for quick UI checks |
| Dev tooling | `tsx` | — | Run the TypeScript engine tests in Node with no build step |

## Excluded native modules

`react-native-reanimated` and `react-native-worklets` are installed as dependencies of `expo-router`, but the app doesn't use them. They're excluded from native linking in `package.json`:

```json
"expo": { "autolinking": { "exclude": ["react-native-reanimated", "react-native-worklets"] } }
```

This makes Android builds much faster and the APK smaller. If a future feature needs Reanimated (for example gesture-driven animations), remove it from this list and rebuild.

## Platform targets

| Platform | Minimum | Notes |
| --- | --- | --- |
| Android | Expo SDK 58 default (API 24+) | Release APK built for `armeabi-v7a` and `arm64-v8a`. Target SDK 36 |
| iOS | Expo SDK 58 default | Needs EAS or a Mac with Xcode to build |
| Web | Modern browsers | Development preview only |

## Identifiers

| Key | Value |
| --- | --- |
| App name | Pitchside |
| Slug / scheme | `pitchside` |
| Android package | `com.calebtek.pitchside` |
| iOS bundle ID | `com.calebtek.pitchside` |

Change these in `app.json` **before** the first store upload. A store listing's package ID can't be changed later.
