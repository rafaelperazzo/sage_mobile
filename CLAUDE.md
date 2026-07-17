# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SAGE (Sistema de Alocação e Gestão de Espaços) — a React Native (Expo) mobile app for managing classroom allocations, auditorium reservations, and maintenance tickets at the Computer Science Department of UFRPE (Brazil).

## Commands

```bash
# Development
npx expo start          # Start dev server (Expo Go)
npx expo run:android    # Run on Android device/emulator
npx expo run:ios        # Run on iOS simulator

# Git helpers (interactive whiptail wizards)
./commit.sh             # Conventional-commit prompt + push (no version bump)
./deploy.sh             # Same, plus version bump in app.json + git tag + push --tags

# Build & Deploy (run these directly; deploy.sh's tag push triggers the CI equivalents instead — see CI/CD below)
./update.sh "msg"       # OTA update (JS/assets only, no store submission)
./build-and-submit.sh   # Local native build + Play Store submission
./build-submit.sh       # EAS cloud build + Play Store submission
```

## CI/CD

Pushing a version tag (as `./deploy.sh` does) drives two GitHub Actions workflows instead of running the build scripts locally:
- Tag `v*.*.0` (major/minor bump) → [.github/workflows/build-and-submit.yml](.github/workflows/build-and-submit.yml): sets `app.json` version from the tag, runs `eas build --local`, then `eas submit` to the Play Store.
- Tag `v*.*.[1-9]*` (patch bump) → [.github/workflows/eas-update.yml](.github/workflows/eas-update.yml): publishes an OTA update via `eas update` to the `production` branch.
- [.github/workflows/e2e-tests.yml](.github/workflows/e2e-tests.yml): builds a debug APK and runs the Maestro flows via `test.sh` on an Android emulator (`workflow_dispatch` or weekdays 06:00 UTC).

# Testing (Maestro E2E)

```bash
maestro test .maestro/                                          # Run all flows
maestro test .maestro/flows/00_app_launch.yaml                 # Run a single flow
maestro test .maestro/ --format junit --output report.xml      # Run with JUnit report
```

Flows are in [.maestro/flows/](.maestro/flows/) and cover: `app_launch`, `home_tab`, `map_tab`, `agenda_tab`, `report_tab`, `auditorio_tab`, `manutencao_tab`, `navigation_tabs`, `login_modal`, `sobre_screen`.

## Architecture

### Routing

Expo Router file-based routing under [app/](app/). Tab navigation lives in [app/(tabs)/](app/(tabs)/). Dynamic CRUD routes follow the pattern `app/[module]/[id]/` with `create.tsx`, `view.tsx`, and `edit.tsx` screens.

### Feature Modules

Only `map` and `report` have dedicated code under [src/modules/](src/modules/), reused by their route files:
- `map` — `WeekGrid`, `BuscarSala` (discipline-search panel), `AllocationCard`, `gridUtils`.
- `report` — `occupancyUtils`.

The other domains (`agenda`, `auditorio`, `manutencao`, `auth`, `home`, `sobre`) have no `src/modules/<domain>/` directory — all their screen logic lives directly in the route file itself (e.g. `app/(tabs)/agenda.tsx` is a single self-contained screen with its own state, search/autocomplete, and modal). Check the route file first before assuming a module directory exists for a given domain.

### Data Layer

All database access goes through [src/lib/supabase.ts](src/lib/supabase.ts). This file holds the Supabase client and typed CRUD functions. Never call Supabase directly from components — use the hooks.

Custom hooks in [src/hooks/](src/hooks/) wrap Supabase calls with local state and business logic:
- `useAlocacoes` — classroom allocation CRUD + time-slot conflict detection
- `useReservas` — auditorium reservation CRUD + conflict detection
- `useManutencao` — maintenance ticket CRUD
- `useAppUpdates` — OTA update polling via expo-updates
- `useAuth` — login/logout wrapping AuthContext

### State Management

Two React Contexts in [src/contexts/](src/contexts/):
- `AuthContext` — current user session (Supabase Auth, stored via SecureStore / AsyncStorage hybrid)
- `PeriodoContext` — selected academic period (semester), used to filter allocations globally

### Styling

NativeWind (Tailwind CSS) is configured (global stylesheet [src/global.css](src/global.css), `@/*` alias resolves to `src/`), but in practice only [src/components/ui/PageShell.tsx](src/components/ui/PageShell.tsx) and [app/login.tsx](app/login.tsx) use `className`. Every other screen styles with inline React Native `style={{...}}` objects, including per-room-type color maps (`sala_aula`/`sala_inovacao`/`laboratorio`) duplicated locally in several files. Follow the inline-style convention when touching existing screens.

### Types

Shared TypeScript types live in [src/types/index.ts](src/types/index.ts). Key types: `Alocacao`, `Reserva`, `Manutencao`.

### Constants

Room lists and other static data are in [src/constants/](src/constants/).

## Environment

Requires a `.env` file at the project root:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Build System

- EAS Build configuration in [eas.json](eas.json): `production` profile produces an AAB for Play Store; `preview` produces an APK.
- Android `versionCode` and iOS `buildNumber` auto-increment on EAS builds.
- Legacy peer deps mode is required: `NPM_CONFIG_LEGACY_PEER_DEPS=true`.
- Native Android fixes (deprecated edge-to-edge style attributes pulled in by libraries) are applied by the config plugin [plugins/withAndroidFixes.js](plugins/withAndroidFixes.js), registered in `app.json`'s `plugins` array — it runs on every `expo prebuild`. There is no separate `prebuild.sh`/`fix.sh` script for this anymore.
- See [COMMANDS.md](COMMANDS.md) for full deployment workflow documentation.
