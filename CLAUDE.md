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

Expo Router file-based routing under [app/](app/). Tab navigation lives in [app/(tabs)/](app/(tabs)/). Dynamic CRUD routes follow the pattern `app/[module]/[id]/` with `create.tsx`, `view.tsx`, and `edit.tsx` screens. All non-tab routes must be registered as `<Stack.Screen>` entries in [app/_layout.tsx](app/_layout.tsx) (title, `presentation: 'modal'`, etc.) — a route file alone is not enough to get the right header/presentation.

Two standalone (non-CRUD) routes worth knowing about:
- [app/disciplinas.tsx](app/disciplinas.tsx) — read-only list of all disciplines for the active período (excludes `curso === 'BSI'`), linked from the home screen ([app/(tabs)/index.tsx](app/(tabs)/index.tsx)), just below the "Sobre o SAGE" link.
- `app/reservas/create.tsx` and `app/reservas/[id]/edit.tsx` — reservas pontuais, shared by Map and Rural via a `modulo` param. In both screens, tapping a free slot opens an `Alert` offering "Nova alocação" (existing flow) or "Nova reserva". Reservas are only shown in slots with no alocação: the free slot turns into an amber **VER RESERVAS** cell that opens `ReservasSlotModal`. The reserva's date is locked to the slot's weekday.
- `app/infra/[sala]/edit.tsx` — admin-only infra editor, opened from the `InfraInfoBanner` tap target in Map and Auditório (see below).

### Feature Modules

`map`, `report`, and `infra` have dedicated code under [src/modules/](src/modules/), reused by their route files:
- `map` — `WeekGrid`, `BuscarSala` (discipline-search panel), `AllocationCard`, `gridUtils`, plus the reservas pontuais UI (`ReservasSlotModal`, `ReservaForm`) and the alocação forms shared by Map and Rural (`AlocacaoCreateForm`, `AlocacaoEditForm`, `HorarioFields`). `WeekGrid` is shared by Map and Rural. `alocacaoLote` holds the pure batch rules:
  - "same disciplina" means the same `disciplina` + `professor` + `curso` (normalized; `null` only matches `null`);
  - `conflitosDoLote` checks each candidate against existing alocações, future reservas pontuais (these **block** an alocação) and the other candidates in the same batch.

  The routes `app/{map,rural}/create.tsx` and `app/{map,rural}/[id]/edit.tsx` are thin wrappers:
  - creation allows up to 3 alocações at once (different dia/horário/sala);
  - editing can change the sala and can "reflect" disciplina/professor/curso/sala to every occurrence of the turma;
  - `curso` is required on create and edit (`CursoField`: the período's existing cursos, or "Outro…" to type a new one).
  - removal can delete just this occurrence or all of them.
- `map/pdf` — export of the weekly grid to PDF.
  - `gradeHtml.ts` is a pure HTML generator: A4 landscape, one sala per page, same positional layout as `WeekGrid`, course colors plus a legend.
  - `exportarGrade.ts` renders with `expo-print`, renames the file in the cache with `expo-file-system` and opens the system share sheet with `expo-sharing`. It also holds the `useExportarGrade()` hook.
  - Map exports the selected sala. Rural also offers the whole prédio: `predioDaSala()` = the sala-name prefix before `" - "`, e.g. `CEGOE - SALA 05` → `CEGOE`. It lives in `src/lib/predio.ts` together with `ordenarSalas()`, the natural sort order, and is shared with the Report.
- `report` — `occupancyUtils` and `ReportView`.
  - `calcularOcupacao(alocacoes, salas)` takes the room list, so it works for both modules.
  - Capacity is 12h per weekday. Daytime counts real hours, with overlaps merged. At night, each block (18:30–20:10, 20:10–21:50) counts as a full **2h** if any alocação touches it. The result is capped at 100%.
  - `app/(tabs)/report.tsx` switches between SAGE Map and SAGE Rural. Each module is its own component, so only the active module's hooks run.
  - SAGE Rural has a prédio filter. On "Todos", the chart shows each prédio's average.
- `infra` — `InfraInfoBanner`, the informational card showing a sala's infrastructure (cadeiras, projetor, tv, hdmi, arcondicionado, computadores) from `infra_salas`; reused by both `app/(tabs)/map.tsx` (per selected sala) and `app/(tabs)/auditorio.tsx` (hardcoded to `SALA 07`, the auditório's row in `infra_salas`). Tapping it navigates admins to `app/infra/[sala]/edit.tsx`.

The other domains (`agenda`, `manutencao`, `auth`, `home`, `sobre`) have no `src/modules/<domain>/` directory — all their screen logic lives directly in the route file itself (e.g. `app/(tabs)/agenda.tsx` is a single self-contained screen with its own state, search/autocomplete, and modal). Check the route file first before assuming a module directory exists for a given domain.

### Data Layer

All database access goes through [src/lib/supabase.ts](src/lib/supabase.ts). This file holds the Supabase client and typed CRUD functions. Never call Supabase directly from components — use the hooks.

Custom hooks in [src/hooks/](src/hooks/) wrap Supabase calls with local state and business logic:
- `useAlocacoes` — classroom allocation CRUD + time-slot conflict detection
- `useReservas` — auditorium reservation CRUD + conflict detection
- `useManutencao` — maintenance ticket CRUD
- `useReservasPontuais` — `reservas_pontuais` CRUD (one-off, dated bookings) for a sala + `modulo` (`'map' | 'rural'`); loads only future rows (`data >= hoje`) and checks conflicts against both the sala's alocações (same weekday) and other reservas (same date)
- `useAlocacoesModulo` — `useContextoMap()` / `useContextoRural()` return the same `ModuloContexto` shape:
  - the período's alocações and the module's future reservas;
  - the module's salas, permission and accent color;
  - batch `insertMany`/`updateMany`/`removeMany`.

  `<ComModulo modulo render={(ctx) => ...}>` picks one without running the other module's queries.
- `useInfraSala` — fetch/update a single `infra_salas` row by `sala` name (read-only for all, write requires an authenticated session per RLS)
- `useAppUpdates` — OTA update polling via expo-updates
- `useStoreUpdates` — Google Play In-App Updates via `expo-in-app-updates` (Android release builds only). Uses the **immediate** flow at launch: the lib auto-calls `completeUpdate()` when a flexible download finishes, which would restart the app mid-use. Only testable on a build installed from the Play Store (internal testing track / internal app sharing).
- `useAuth` — login/logout wrapping AuthContext

### State Management

Three React Contexts in [src/contexts/](src/contexts/):
- `AuthContext` — current user session (Supabase Auth, stored via SecureStore / AsyncStorage hybrid)
- `PeriodoContext` — selected academic period (semester), used to filter allocations globally
- `PeriodoExternaContext` — the SAGE Rural equivalent. It is shared by the Rural grid and its create/edit screens, so they save into the período selected on screen. It fetches the período list lazily, on the first `usePeriodoExterna()` call, since that requires paginating `externas`. `src/hooks/usePeriodoExterna.ts` re-exports it.

### Styling

NativeWind (Tailwind CSS) is configured (global stylesheet [src/global.css](src/global.css), `@/*` alias resolves to `src/`), but in practice only [src/components/ui/PageShell.tsx](src/components/ui/PageShell.tsx) and [app/login.tsx](app/login.tsx) use `className`. Every other screen styles with inline React Native `style={{...}}` objects, including per-room-type color maps (`sala_aula`/`sala_inovacao`/`laboratorio`) duplicated locally in several files. Follow the inline-style convention when touching existing screens.

### Types

Shared TypeScript types live in [src/types/index.ts](src/types/index.ts). Key types: `Alocacao`, `Reserva`, `Manutencao`, `InfraSala`.

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
- Android `compileSdkVersion`/`targetSdkVersion` are pinned to 36 (Android 16) via the `expo-build-properties` plugin in `app.json`, per Play Store's target API level requirement. Bump both together on future SDK requirement changes.
- Android `versionCode` and iOS `buildNumber` auto-increment on EAS builds.
- Legacy peer deps mode is required: `NPM_CONFIG_LEGACY_PEER_DEPS=true`.
- Adding a native module means the release must be a **minor** bump (native build via `build-and-submit.yml`), never a patch/OTA. `expo-print`, `expo-sharing` and `expo-file-system` were added for PDF export; `expo-in-app-updates` for Play In-App Updates. `deploy.sh` sets `version`/`runtimeVersion` only on major/minor bumps; a patch leaves `app.json` untouched, so its OTA reaches the binaries built from the last major/minor — which lack any native module added since.
- Native Android fixes (deprecated edge-to-edge style attributes pulled in by libraries) are applied by the config plugin [plugins/withAndroidFixes.js](plugins/withAndroidFixes.js), registered in `app.json`'s `plugins` array — it runs on every `expo prebuild`. There is no separate `prebuild.sh`/`fix.sh` script for this anymore.
- See [COMMANDS.md](COMMANDS.md) for full deployment workflow documentation.
