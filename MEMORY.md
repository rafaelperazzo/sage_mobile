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
