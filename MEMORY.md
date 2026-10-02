# MEMORY.md

Project-level decision log. Not user-facing docs (see [README.md](README.md)) and not
agent instructions (see [CLAUDE.md](CLAUDE.md)) — this records *why* things ended up the
way they did, for whoever (human or AI) touches this code next.

## 2026-08-07 — Infraestrutura das salas (`infra_salas`) + Lista de Disciplinas

**Context:** the `infra_salas` table already existed in Supabase (14 rows: the 13 salas in
`SALAS`/`src/constants/salas.ts` + `SALA 07`) before any app code referenced it. Columns:
`sala`, `cadeiras`, `projetor` (0/1), `tv` (0/1), `hdmi` (0/1), `arcondicionado` (integer
count, not boolean — e.g. `SALA 07` has 2 units), `computadores`. RLS was already set up
identically to every other table in this project (`Leitura pública` for `SELECT`,
`authenticated` role for `INSERT`/`UPDATE`/`DELETE`) — no migration was needed to support
the admin-edit feature, `isAdmin` (`user !== null`) was sufficient.

**What was built:**
- `InfraInfoBanner` ([src/modules/infra/InfraInfoBanner.tsx](src/modules/infra/InfraInfoBanner.tsx)) —
  shared read/write-affordance card showing all 6 `infra_salas` columns as prose + badges.
  Reused by both Map (per selected sala) and Auditório (hardcoded to `SALA 07`, since the
  auditório itself isn't a room in `SALAS` and has no tab-level sala selector).
- `app/infra/[sala]/edit.tsx` — single edit screen for all 6 fields, admin-only, shared by
  both entry points via the `sala` route param. Booleans use a Sim/Não segmented control
  (this codebase has no `Switch` usage anywhere else, so a toggle button pair was used to
  match existing form conventions instead).
- `app/disciplinas.tsx` — groups `alocacao_2026.1` rows by
  `disciplina + professor + curso + semestre` (a "turma"), listing each turma's individual
  meeting times (dia/horário/sala) as sub-lines within one table row. Sorted by discipline
  name with the leading `"CODE - "` prefix stripped (`stripCodigo()`), per the user's
  request to sort "desconsiderando o código". Excludes `curso === 'BSI'` entirely (per
  follow-up request the same day — BSI disciplines should never appear in this list).
  Linked from the home screen ([app/(tabs)/index.tsx](app/(tabs)/index.tsx)), directly
  below the existing "Sobre o SAGE" link — **not** from inside `app/sobre.tsx` itself
  (first attempt put it at the bottom of the Sobre screen; the user corrected this to the
  home screen instead).

**Gotchas:**
- All non-tab routes (including the two new ones) must be registered as `<Stack.Screen>`
  in [app/_layout.tsx](app/_layout.tsx) or they render without the expected header/modal
  presentation — easy to forget since the route file alone "works" in dev.
- `infra/[sala]/edit.tsx` assumes a row already exists for the given `sala` (true for all
  14 current rows) and only supports `UPDATE`, not `INSERT` — if a new sala is ever added
  to `SALAS` without a matching `infra_salas` row, the edit screen will show a "não
  cadastrada" message instead of a blank form.
- `curso` values in `alocacao_2026.1` are course-code abbreviations, not just the ones in
  the UI you'd expect from a CS department: `BA`, `BCB`, `BCC`, `BEA`, `BEAA`, `BEF`,
  `BEP`, `BG`, `BSI`, `BZ`, `DC`, `DCC`, `LC`, `LEF`, `LF`, `LQ` all appear. Any future
  "exclude/filter by curso" request should double-check the exact code against a live
  `select distinct curso from "alocacao_2026.1"` rather than assuming.

## 2026-08-11 — PostgREST 1000-row cap hiding rows in `externas` (SAGE Rural)

**Context:** newly-inserted `DEFIS - SALA *` rows weren't showing up in the SAGE Rural sala
select. Root cause: PostgREST (Supabase's REST layer) caps every response at 1000 rows by
default, and `externas` had grown to 1034 rows for period `2026.2` — the DEFIS rows, added
last, fell past the cutoff on any unpaginated `.select()`.

**Fix:** added `fetchAllPages()` in [src/lib/supabase.ts](src/lib/supabase.ts) — a generic
helper that loops `.range(from, to)` in pages of 1000 until a short page signals the end.
Applied to all three `externas`-wide reads: `fetchPeriodosExternas`, `fetchSalasExternas`,
`fetchAlocacoesExternas`. `fetchAlocacoesExternasPorSala` (filtered by `sala` + `periodo`)
was left as a single `.select()` since a single room/period slice is nowhere near 1000 rows.

**Gotcha for next time:** any other `.select()` against a table without `.range()`/`.limit()`
is silently capped at 1000 rows — this bug will recur elsewhere as other tables grow past
that size. `alocacao_2026.1` and `infra_salas` are far below it today but worth checking
first if a similar "some rows missing" report comes in for those.

## 2026-09-30 — Reservas pontuais, alocação em lote, curso, PDF e Report com Rural

Six features in one session. All uncommitted at the end of the day, as a single changeset. Code-level structure is documented in [CLAUDE.md](CLAUDE.md); this entry records the *why* and the gotchas.

### 1. Reservas pontuais (Map + Rural)

**Context:** the `reservas_pontuais` table already existed. Its columns: `disciplina`, `professor`, `data`, `inicio`/`fim` (text `"HH:MM"`), `sala`, and `modulo`, restricted by CHECK to `'map' | 'rural'`. Its RLS matches `externas`. No migration was needed.

**User decisions:**
- **Slot tap (admin):** an `Alert` asks "Nova alocação" or "Nova reserva".
- **Date:** the reserva's date is **locked to the weekday** of the tapped column; the default is its next occurrence.
- **Time:** start and end are pre-filled from the slot and can be adjusted.
- **Conflicts:** a reserva is blocked if it clashes with an alocação (same weekday) or with another reserva on the same date.
- **Grid display:** a free slot with future reservas becomes an amber **VER RESERVAS** cell. Anyone can open its modal. The modal lists only **that slot's** future reservas (`data >= hoje`).

**Gotchas:**
- `hojeYMD()` builds the date from local time. `toISOString()` would shift it to UTC.
- Free hours outside the 2-hour daytime blocks (07h, 12h, 13h) get a VER RESERVAS block only when a reserva exists there, so no reserva is ever invisible.

### 2. Alocação em até 3 dias/horários + alteração/remoção em lote

**User decisions:**
- **Create:** a checkbox "Alocar em outro dia/horário" adds up to 2 extra blocks. Each has its own dia, horário and **sala**.
- **Edit:** the sala is now editable. "Refletir em todos os dias e horários da disciplina" propagates **disciplina, professor, curso and sala**; dia and horário change only on the edited row.
- **Remove:** "Só esta" or "Todas".
- **Same turma** = same `disciplina` + `professor` + `curso`, compared after `normalize` + trim; `null` only matches `null`.
- **Conflicts now blocked** (user choice), including between blocks of the same form:
  - an alocação against another alocação;
  - an alocação against a **future reserva pontual**.

**Implementation choices:**
- Batch create is a single `.insert([...])`, so it is atomic.
- Batch update is sequential `update`s, because PostgREST has no transactions. Everything is validated before the first write.
- `useContextoMap()` / `useContextoRural()` plus `<ComModulo>` keep the Map screens from ever downloading the paginated `externas` table.

**Bug fixed along the way:** `BuscarSala` always navigated to `/map/[id]/edit`, even from SAGE Rural. Once edit looked up ids across the whole período, that could have opened the **wrong** Map alocação. It now receives `modulo`.

### 3. Curso no cadastro/edição + período compartilhado no Rural

- **Why:** alocações created by the app used to save `curso = null`, so they never grouped with imported turmas.
- **`curso` is now required** (`CursoField`). It is a picker of the período's existing cursos plus "Outro…" for free text. The picker avoids spelling variants: `externas` already had `"LICENCIATURA EM HISTÓRIA"` alongside `" LICENCIATURA EM HISTÓRIA "`.
- **Período no Rural:** the user wants alocações saved into the período **selected on screen**, as Map already does. Rural create/edit used to call their own `usePeriodoExterna()`, which always picked the current período.
  - Fix: `PeriodoExternaContext`, mounted in `app/_layout.tsx`.
  - It loads lazily, on the first `usePeriodoExterna()` call.
  - The Salas Livres screen now uses that same shared período.
- The período picker on both screens only renders when `periodos.length > 1`. `externas` has only `2026.2` today, so the Rural picker is hidden. The user asked where it was; it is not missing.

### 4. Exportar grade em PDF

**Behavior:**
- Map exports one sala.
- Rural also exports a whole **prédio** (one sala per page). A prédio is the sala-name prefix before `" - "`, since there is no prédio column.
- Anyone can export.
- Reservas pontuais are excluded.
- The SÁB column appears only if some alocação in the document falls on Saturday.

**Implementation:**
- An HTML/CSS A4-landscape page is rendered by `expo-print`, renamed with `expo-file-system` (`File`/`Paths`), then shared with `expo-sharing`.
- The layout was verified by generating the HTML from real rows (via sucrase in a scratch dir), printing it with headless Chrome and inspecting the PNGs.

**Release gotcha:**
- These are **native modules**. Ship them as a **minor** tag, which triggers a native build.
- A patch/OTA would reach no installed binary: `deploy.sh` rewrites `runtimeVersion` on every bump, and `runtimeVersion` is a fixed string, not a policy.

### 5. Incident: `Cannot find module 'react-refresh/babel'`

- **Cause:**
  - The PDF deps were installed with `NPM_CONFIG_LEGACY_PEER_DEPS=true`, as CLAUDE.md says.
  - The committed `package-lock.json` contains `"peer": true` entries (`react-refresh`, `react-dom`, `@react-native/babel-preset`…), and legacy mode **pruned** them.
  - `babel-preset-expo` requires `react-refresh` in dev mode.
- **Why it slipped:** a production `npx expo export` passed, because production builds don't load the refresh plugin.
- **Fix:** `git checkout HEAD -- package-lock.json`, then a plain `npm install`. It ran with no ERESOLVE, and the lock now only *adds* the 3 packages.
- **Lesson:** after any dependency change, check `git diff package-lock.json` for removed `node_modules/...` entries. Then verify with a **dev** bundle: `expo start`, then fetch `entry.bundle?platform=android&dev=true&hot=true`.
- **Open question:** CLAUDE.md's "legacy peer deps is required" contradicts the committed lockfile. It was left unchanged; the user was asked.

### 6. SAGE Report: Rural + night rounding

**Rule (user decision):**
- Capacity stays **12h per weekday**: morning 4h + afternoon 4h + 2 night blocks × 2h.
- Each night block (18:30–20:10, 20:10–21:50) counts **2h if any alocação touches it**; partial use still counts.
- Daytime counts real hours, with overlaps merged.
- The result is capped at 100%. Saturday is excluded, as before.

**Verified:**
- SALA 02 / 2026.2 = 56h = **93%**; the old rule gave 89%.
- DEFIS rooms were checked by hand.

**UI:**
- A **SAGE Map | SAGE Rural** toggle. Each module is its own component, so only the active one's hooks run.
- Rural has a prédio filter. On "Todos", the chart shows each prédio's average.

**Expect higher 2026.1 numbers:** 2026.1 night classes use full hours (e.g. 19:00–21:00). Under the any-touch rule these touch both blocks and count 4h. This is intended.

**Pre-existing, left as is:** the Report chart passes no `font` to `CartesianChart`, so victory-native draws no axis labels, only bars. The list below the chart carries the names.

## 2026-10-02 — Google Play In-App Updates

- **What:** `src/hooks/useStoreUpdates.ts`, using `expo-in-app-updates` 0.12.0 (Play Core `app-update` 2.1.0). It is called next to `useAppUpdates` in `app/_layout.tsx`.
- **Flow:** **immediate** (full-screen Play UI at launch). The flexible flow was rejected because the lib's native code calls `completeUpdate()` as soon as the download finishes, which would restart the app mid-use. If the user declines, the check repeats on the next launch.
- **Incident:** `Cannot find native module 'ExpoInAppUpdates'` in a dev client/Expo Go without the module. A top-level `import` runs `requireNativeModule` at load time, before any `__DEV__` guard. Fix: the hook first checks `requireOptionalNativeModule('ExpoInAppUpdates')` from `expo`, then loads the lib with `await import(...)`. This also keeps OTA patches safe on older binaries.
- **Rollout:** checking the Play Store only works from the first **minor** release that contains the module (app.json was at 33.0.0, so 33.1.0). Users on 33.0.x must update the old way once. It can only be tested on a Play-installed build (internal testing track / internal app sharing) with a higher `versionCode` published.
- **Doc fix:** CLAUDE.md wrongly said `deploy.sh` bumps `runtimeVersion` on every bump. It only does so on major/minor (lines 103–114); patch leaves `app.json` untouched, so OTA keeps reaching the current binaries.
- **Verified:** tsc, autolinking, and an Android dev bundle (HTTP 200). The update flow itself was not tested on a device.
