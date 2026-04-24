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

# Build & Deploy (custom scripts)
./prebuild.sh           # Clean prebuild with native fixes
./update.sh "msg"       # OTA update (JS/assets only, no store submission)
./build-and-submit.sh   # Local native build + Play Store submission
./build-submit.sh       # EAS cloud build + Play Store submission
./fix.sh                # Quick native file fixes after prebuild
```

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

Business logic is organized under [src/modules/](src/modules/) by domain: `map` (room allocation grid), `agenda` (schedule view), `auditorio` (auditorium reservations), `manutencao` (maintenance tickets), `report` (statistics), `auth`, `home`, `sobre`.

Each module typically has screen-level components consumed by the route files.

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

NativeWind (Tailwind CSS) throughout. Classes are standard Tailwind. The global stylesheet is [src/global.css](src/global.css). The `@/*` path alias resolves to `src/`.

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
- See [COMMANDS.md](COMMANDS.md) for full deployment workflow documentation.
