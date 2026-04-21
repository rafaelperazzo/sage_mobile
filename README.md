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
- Node.js (v20+)
- NPM ou Yarn
- Expo Go instalado no dispositivo

### Passo a Passo

1. **Clone e Instale:**
   ```bash
   git clone https://github.com/rafaelperazzo/sage_mobile.git
   cd sage_mobile
   npm install --legacy-peer-deps
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
   ```

---

## 🚀 CI/CD

O deploy é totalmente automatizado via GitHub Actions:

| Ação | Como disparar |
| :--- | :--- |
| **Build nativo + Play Store** | Criar tag `v*` (ex: `git tag v24.0.0 && git push origin v24.0.0`) |
| **OTA Update (sem novo build)** | Criar tag `u*` (ex: `git tag u24.1.0 && git push origin u24.1.0`) |

Use `./commit.sh` para guiar o processo interativamente.

---
<div align="center">
  <sub>Criado com ❤️ por <a href="https://github.com/rafaelperazzo">Rafael Perazzo</a></sub>
</div>
