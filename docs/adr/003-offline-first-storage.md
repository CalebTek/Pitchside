# ADR-003: Offline-first, on-device storage for 1.0

**Status:** Accepted · **Date:** 2026-11

## Context
Tournaments are run in living rooms, hostels and gaming centres, sometimes with poor data coverage. A backend adds cost, sign-up friction and privacy obligations.

## Decision
Keep all data on the device using Zustand `persist` with AsyncStorage (key `pitchside-v1`). No accounts and no network calls.

## Consequences
- Zero running costs. Works fully offline. "No data collected" on store privacy forms.
- Data doesn't sync between phones and is lost if the app is uninstalled. Export/import and cloud sync are on the [roadmap](../roadmap.md).
- Because the data is plain JSON, adding sync later is simple.
