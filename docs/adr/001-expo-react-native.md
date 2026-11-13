# ADR-001: Use Expo + React Native for Android and iOS

**Status:** Accepted · **Date:** 2026-11

## Context
The app has to be installable on Android and iOS, look polished and be quick to build. There's a single developer, and no Mac is guaranteed for iOS builds.

## Options considered
| Option | Pros | Cons |
| --- | --- | --- |
| Native (Kotlin + Swift) | Best platform fit | Two codebases, double the work |
| Flutter | Good performance, one codebase | Dart; less overlap with web/TypeScript skills |
| .NET MAUI | Fits existing .NET experience | Smaller mobile ecosystem, heavier tooling for this kind of UI |
| **Expo + React Native** | One TypeScript codebase, Expo Go for instant testing, EAS cloud builds for iOS, big ecosystem | Native modules need a development build |

## Decision
Use Expo (SDK 58) with React Native 0.88, TypeScript and expo-router.

## Consequences
- The tournament engine is plain TypeScript and can be reused on a future web or backend.
- iOS builds go through EAS, so no Mac is needed.
- Store builds need EAS or a local `prebuild`.
