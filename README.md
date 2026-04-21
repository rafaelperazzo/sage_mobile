# SAGE — Sistema de Alocação e Gestão de Espaços

O **SAGE** é um aplicativo móvel desenvolvido com **React Native** e **Expo** para gerenciar a alocação de salas, reservas de auditório e chamados de manutenção no Departamento de Computação da **UFRPE**.

## 🚀 Principais Funcionalidades

- **Mapa de Alocação:** Visualização da grade de horários e ocupação das salas de aula.
- **Agenda:** Consulta de horários por período letivo.
- **Reservas de Auditório:** Sistema de agendamento e consulta de disponibilidade do auditório.
- **Manutenção:** Abertura e acompanhamento de tickets de manutenção para infraestrutura.
- **Atualizações OTA:** Suporte a atualizações Over-The-Air via Expo Updates.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React Native](https://reactnative.dev/) com [Expo](https://expo.dev/)
- **Roteamento:** [Expo Router](https://docs.expo.dev/router/introduction/)
- **Estilização:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Backend/Database:** [Supabase](https://supabase.com/)
- **Gráficos:** [Victory Native](https://formidable.com/open-source/victory-native/)
- **Animações:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) e [Skia](https://shopify.github.io/react-native-skia/)

## 📦 Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/rafaelperazzo/sage_mobile.git
   cd sage_mobile
   ```

2. **Instale as dependências:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npx expo start
   ```

## 🏗️ Build e Deploy

O projeto utiliza scripts customizados para facilitar o processo de build e submissão:

- `./prebuild.sh`: Limpa e gera os arquivos nativos com correções específicas.
- `./update.sh "mensagem"`: Publica uma atualização OTA.
- `./build-submit.sh`: Realiza o build via EAS Cloud e submete à Play Store.

---
Desenvolvido por [Rafael Perazzo](https://github.com/rafaelperazzo).
