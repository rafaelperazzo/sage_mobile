<div align="center">

  # SAGE
  
  ### Sistema de Alocação e Gestão de Espaços

  *Desenvolvido para o Departamento de Computação da UFRPE*

  [![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-SDK_55-000020?logo=expo&logoColor=white)](https://expo.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
  [![Tailwind CSS](https://img.shields.io/badge/NativeWind-Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://www.nativewind.dev/)
  [![License](https://img.shields.io/badge/License-Private-lightgrey.svg)](#)

  [![Build & Submit](https://github.com/rafaelperazzo/sage_mobile/actions/workflows/build-and-submit.yml/badge.svg)](https://github.com/rafaelperazzo/sage_mobile/actions/workflows/build-and-submit.yml)
  [![EAS Update](https://github.com/rafaelperazzo/sage_mobile/actions/workflows/eas-update.yml/badge.svg)](https://github.com/rafaelperazzo/sage_mobile/actions/workflows/eas-update.yml)
  [![E2E Tests](https://github.com/rafaelperazzo/sage_mobile/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/rafaelperazzo/sage_mobile/actions/workflows/e2e-tests.yml)

</div>


---

## 📱 O Projeto

O **SAGE Mobile** é a solução definitiva para a gestão de infraestrutura acadêmica no Departamento de Computação da **UFRPE**. Integrando agendamento de aulas, reservas de auditório e tickets de manutenção em uma experiência mobile fluida e intuitiva.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <b>Disponível na Play Store</b><br><br>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://play.google.com/store/apps/details?id=com.rafaelperazzo.appdc" alt="QR Code Play Store"><br>
        <a href="https://play.google.com/store/apps/details?id=com.rafaelperazzo.appdc">
          <img src="https://img.shields.io/badge/Google_Play-Instalar-green?logo=google-play&logoColor=white&style=for-the-badge" alt="Google Play Store">
        </a>
      </td>
      <td align="center" width="50"></td>
      <td align="center">
        <b>Versão Web</b><br><br>
        <img src="https://cdn-icons-png.flaticon.com/512/841/841364.png" alt="Web Version Icon" width="120"><br>
        <a href="https://rafaelperazzo.github.io/sage">
          <img src="https://img.shields.io/badge/Acessar-WebApp-blue?logo=google-chrome&logoColor=white&style=for-the-badge" alt="Web App">
        </a>
      </td>
    </tr>
  </table>
</div>

---

## ✨ Funcionalidades

- 🗺️ **Mapa Dinâmico:** Visualização em tempo real da ocupação das salas de aula.
- 📅 **Agenda Acadêmica:** Filtros inteligentes por semestre e dia da semana.
- 🎭 **Reservas de Auditório:** Sistema completo de agendamento com detecção de conflitos.
- 🛠️ **Gestão de Manutenção:** Abertura de tickets com status em tempo real.
- 🔄 **Atualizações Instantâneas:** Receba melhorias sem precisar atualizar pela loja (OTA).

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Mobile Core** | React Native + Expo |
| **Navigation** | Expo Router (File-based) |
| **Styling** | NativeWind (Tailwind CSS) |
| **Database/Auth** | Supabase (PostgreSQL) |
| **Charts/UI** | Victory Native & Skia |

---

## 🚀 Como Iniciar (Desenvolvimento)

### Pré-requisitos
- Node.js (v24+)
- NPM ou Yarn
- Expo Go instalado no dispositivo

### Passo a Passo

1. **Clone e Instale:**
   ```bash
   git clone https://github.com/rafaelperazzo/sage_mobile.git
   cd sage_mobile
   npm ci
   ```

2. **Ambiente:**
   Crie um `.env` com as chaves do projeto (consulte o administrador):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **Execução:**
   ```bash
   npx expo start 
   # ou npx expo run:android para rodar direto no emulador
   ```

---

## 🚀 CI/CD e Deploy

### `./commit.sh` — Envio de alterações (sem modificação de versão)

Use quando quiser apenas commitar e enviar código para o repositório, sem gerar nenhuma tag ou disparar pipelines de deploy.

```
commit.sh
  1. Tipo de commit (feat, fix, docs, style, refactor, test, chore, perf)
  2. Mensagem do commit
  3. Confirmação
  4. git add . → git commit → git push origin master
```

### `./deploy.sh` — Deploy interativo com versionamento semântico

Use quando quiser publicar uma nova versão do app. O script guia o processo completo, cria a tag e dispara automaticamente o workflow correto no GitHub Actions.

```
deploy.sh
  1. Tipo de commit
  2. Mensagem do commit
  3. Tipo de versão (major / minor / patch)
  4. Confirmação
  5. Atualiza app.json (apenas em major/minor)
  6. git add . → git commit → git tag → git push
```

| Bump | Tag gerada | `app.json` atualizado | Workflow disparado |
| :--- | :--- | :--- | :--- |
| `major` | `vX.0.0` | ✅ | Build nativo + Play Store |
| `minor` | `vX.Y.0` | ✅ | Build nativo + Play Store |
| `patch` | `vX.Y.Z` (Z ≥ 1) | ❌ | OTA Update (EAS Update) |

> **Regra:** tags terminadas em `.0` disparam o build nativo. Tags com patch ≥ 1 disparam apenas o OTA update.

---

## 🧪 Testes E2E (Maestro)

Os testes de ponta a ponta cobrem todas as telas em **modo público** (sem autenticação), verificando renderização sem erros e navegação completa pelo app.

### Executar localmente

```bash
# Instalar o Maestro CLI (uma vez)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Com o app instalado no emulador ou device:
maestro test .maestro/flows/

# Flow individual:
maestro test .maestro/flows/05_auditorio_tab.yaml
```

### Flows disponíveis

| Flow | Cobertura |
| :--- | :--- |
| `00_app_launch` | App abre sem crash |
| `01_home_tab` | Tela Início — todos os elementos |
| `02_map_tab` | Aba SAGE Map |
| `03_agenda_tab` | Aba SAGE Agenda |
| `04_report_tab` | Aba SAGE Report |
| `05_auditorio_tab` | Aba SAGE Auditório |
| `06_manutencao_tab` | Aba SAGE Manutenção |
| `07_navigation_tabs` | Ciclo completo pelas 6 abas |
| `08_login_modal` | Abre e fecha o modal de login |
| `09_sobre_screen` | Abre e fecha a tela Sobre |

### CI

O workflow [`e2e-tests.yml`](.github/workflows/e2e-tests.yml) executa os testes automaticamente **toda segunda a sexta às 06:00 UTC** e pode ser acionado manualmente via GitHub Actions.

---
<div align="center">
  <sub>Idealizado e projetado por <a href="https://rafaelperazzo.github.io">Rafael Perazzo</a></sub>
</div>
