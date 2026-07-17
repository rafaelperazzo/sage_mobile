# SAGE Mobile — Scripts e Comandos

## Scripts disponíveis

### `commit.sh` — Commit + push
Wizard interativo (whiptail) que pergunta o tipo de commit (conventional commits: `feat`, `fix`, `docs`, ...) e a mensagem, depois faz `git add .`, `git commit` e `git push origin master`. Não mexe em versão nem cria tag.

```bash
./commit.sh
```

---

### `deploy.sh` — Commit + versão + tag (dispara a CI)
Mesmo wizard do `commit.sh`, mas pergunta também o tipo de bump semântico (`major`/`minor`/`patch`), calcula a próxima tag a partir da última `vX.Y.Z` existente, atualiza `version`/`runtimeVersion` em `app.json` (major/minor apenas) e faz `git commit` + `git tag` + `git push origin master --tags`.

```bash
./deploy.sh
```

> Empurrar a tag é o que efetivamente dispara o build/submit ou o OTA update — veja "CI/CD" abaixo. Este é o fluxo recomendado para publicar uma nova versão; os scripts `build-and-submit.sh`/`build-submit.sh`/`update.sh` abaixo são a via manual/local, caso não queira depender da CI.

---

### `update.sh` — Publicar atualização OTA (local, sem CI)
Envia uma atualização over-the-air via Expo Updates sem precisar gerar um novo build. Use para alterações em JS/assets (telas, lógica, textos).

```bash
./update.sh "descrição da mudança"
```

> Não use para mudanças nativas (novos pacotes, permissões, configurações do app.json).

---

### `build-and-submit.sh` — Build local + Submit na Play Store (local, sem CI)
Gera o build de produção localmente (`.aab`) e submete automaticamente à Play Store. Verifica se o repositório está limpo e sincronizado antes de prosseguir.

```bash
./build-and-submit.sh
```

> Requer `git commit` e `git push` de todas as alterações antes de executar.

---

### `build-submit.sh` — Build na nuvem EAS + Submit (local, sem CI)
Dispara o build de produção nos servidores do EAS e submete automaticamente à Play Store ao concluir. Não requer ambiente local configurado para compilação Android.

```bash
./build-submit.sh
```

---

### `test.sh` — Rodar todos os flows do Maestro
Executa cada flow em `.maestro/flows/*.yaml` individualmente, reportando pass/fail por flow e um resumo no final (saída com código de erro se algum flow falhar). É o mesmo script que o workflow `e2e-tests.yml` roda no emulador da CI.

```bash
./test.sh
```

---

> **Correções nativas do Android** (atributos de estilo depreciados vindos de bibliotecas, ex. edge-to-edge) não são mais um script manual — hoje são aplicadas automaticamente pelo config plugin [plugins/withAndroidFixes.js](plugins/withAndroidFixes.js), registrado em `app.json` e executado em todo `expo prebuild`. Os antigos scripts `prebuild.sh`/`fix.sh` foram removidos.

## CI/CD (GitHub Actions)

Empurrar uma tag de versão (o que `deploy.sh` faz) dispara automaticamente:
- Tag `v*.*.0` (major/minor) → [.github/workflows/build-and-submit.yml](.github/workflows/build-and-submit.yml): build EAS local + submit à Play Store.
- Tag `v*.*.[1-9]*` (patch) → [.github/workflows/eas-update.yml](.github/workflows/eas-update.yml): publica OTA update via `eas update`.

Além disso, [.github/workflows/e2e-tests.yml](.github/workflows/e2e-tests.yml) builda um APK de debug e roda `test.sh` num emulador Android — manualmente (`workflow_dispatch`) ou de segunda a sexta às 06:00 UTC.

---

## Quando usar cada script

| Situação | Script |
|---|---|
| Só quero commitar/enviar sem publicar nada | `commit.sh` |
| Quero publicar uma nova versão (deixando a CI buildar/submeter ou fazer o OTA) | `deploy.sh` |
| Corrigi um bug ou alterei uma tela e quero publicar via OTA sem passar pela CI | `update.sh` |
| Adicionei um pacote nativo ou alterei `app.json` e quero buildar localmente | `build-and-submit.sh` |
| Quero buildar na nuvem sem configurar ambiente local | `build-submit.sh` |
| Quero rodar os testes E2E localmente | `test.sh` |

---

## Versionamento

Antes de gerar um novo build nativo, atualize no `app.json`:

```json
"version": "X.Y.Z",
"runtimeVersion": "X.Y.Z"
```

- `version` / `runtimeVersion` — devem ser iguais e incrementadas a cada build publicado na Play Store
- `versionCode` — gerenciado automaticamente pelo EAS Build (`autoIncrement: true` no `eas.json`), não é necessário alterar manualmente
