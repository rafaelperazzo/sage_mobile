#!/usr/bin/env bash

# --- Verificar dependência ---
if ! command -v whiptail &> /dev/null; then
  echo "Erro: whiptail não encontrado. Instale com: sudo apt install whiptail"
  exit 1
fi

TITLE="SAGE — Commit"

# --- Verificar alterações pendentes ---
GIT_STATUS=$(git status --short)
if [[ -z "$GIT_STATUS" ]]; then
  whiptail --title "$TITLE" \
    --msgbox "Nenhuma alteração pendente.\n\nNão há arquivos modificados para enviar." \
    10 55 --ok-button "Sair"
  clear
  exit 0
fi

whiptail --title "$TITLE — Alterações Pendentes" \
  --scrolltext \
  --msgbox "$(git status)" \
  22 70 --ok-button "Prosseguir"

STEP=1

while true; do
  case $STEP in

    # --- Passo 1: Tipo de operação ---
    1)
      MODO=$(whiptail --title "$TITLE" \
        --menu "Qual tipo de operação?" 12 65 2 \
        "commit" "Commit comum (sem tag)" \
        "update" "Commit de OTA update (tag u*)" \
        3>&1 1>&2 2>&3) || { clear; echo "Operação cancelada."; exit 0; }
      STEP=2
      ;;

    # --- Passo 2: Versão da tag (apenas update) ---
    2)
      if [[ "$MODO" == "update" ]]; then
        TAG_VERSION=$(whiptail --title "$TITLE" \
          --inputbox "Versão da tag de update (ex: 24.1.1):" 10 65 "${TAG_VERSION:-}" \
          3>&1 1>&2 2>&3) || { STEP=1; continue; }

        if [[ -z "$TAG_VERSION" ]]; then
          whiptail --title "Atenção" --msgbox "A versão não pode estar vazia." 8 45
          continue
        fi

        UPDATE_TAG="u${TAG_VERSION}"
      fi
      STEP=3
      ;;

    # --- Passo 3: Tipo de commit ---
    3)
      TIPO=$(whiptail --title "$TITLE" \
        --menu "Escolha o tipo de commit:" 20 65 8 \
        "feat"     "Nova funcionalidade" \
        "fix"      "Correção de bug" \
        "docs"     "Documentação" \
        "style"    "Formatação / estilo" \
        "refactor" "Refatoração de código" \
        "test"     "Testes" \
        "chore"    "Tarefas de manutenção" \
        "perf"     "Melhoria de desempenho" \
        3>&1 1>&2 2>&3) || { STEP=2; continue; }
      STEP=4
      ;;

    # --- Passo 4: Mensagem do commit ---
    4)
      MSG=$(whiptail --title "$TITLE" \
        --inputbox "Mensagem do commit:" 10 65 "${MSG:-}" \
        3>&1 1>&2 2>&3) || { STEP=3; continue; }

      if [[ -z "$MSG" ]]; then
        whiptail --title "Atenção" --msgbox "A mensagem não pode estar vazia." 8 45
        continue
      fi

      COMMIT_MSG="${TIPO}: ${MSG}"
      STEP=5
      ;;

    # --- Passo 5: Confirmação ---
    5)
      if [[ "$MODO" == "update" ]]; then
        CONFIRM_TEXT="Confirmar e fazer push?\n\nCommit: $COMMIT_MSG\nTag:    $UPDATE_TAG"
      else
        CONFIRM_TEXT="Confirmar e fazer push?\n\nCommit: $COMMIT_MSG"
      fi

      whiptail --title "$TITLE" \
        --yesno "$CONFIRM_TEXT" 12 65 \
        3>&1 1>&2 2>&3 || { STEP=4; continue; }
      STEP=6
      ;;

    # --- Passo 6: Execução com barra de progresso ---
    6)
      ERR_FILE=$(mktemp)

      if [[ "$MODO" == "update" ]]; then
        (
          echo "10"; echo "# Adicionando arquivos..."
          git add . 2>"$ERR_FILE" || exit 1

          echo "35"; echo "# Criando commit..."
          git commit -m "$COMMIT_MSG" 2>"$ERR_FILE" || exit 1

          echo "60"; echo "# Enviando para o repositório..."
          git push origin master 2>"$ERR_FILE" || exit 1

          echo "80"; echo "# Criando tag $UPDATE_TAG..."
          git tag "$UPDATE_TAG" 2>"$ERR_FILE" || exit 1

          echo "95"; echo "# Enviando tag..."
          git push origin "$UPDATE_TAG" 2>"$ERR_FILE" || exit 1

          echo "100"; echo "# Concluído!"
        ) | whiptail --title "$TITLE" --gauge "Aguarde..." 8 65 0
      else
        (
          echo "10"; echo "# Adicionando arquivos..."
          git add . 2>"$ERR_FILE" || exit 1

          echo "40"; echo "# Criando commit..."
          git commit -m "$COMMIT_MSG" 2>"$ERR_FILE" || exit 1

          echo "75"; echo "# Enviando para o repositório..."
          git push origin master 2>"$ERR_FILE" || exit 1

          echo "100"; echo "# Concluído!"
        ) | whiptail --title "$TITLE" --gauge "Aguarde..." 8 65 0
      fi

      if [ "${PIPESTATUS[0]}" -ne 0 ]; then
        ERR_MSG=$(cat "$ERR_FILE")
        rm -f "$ERR_FILE"
        whiptail --title "Erro" --msgbox "Falha ao executar git:\n\n$ERR_MSG" 15 65
        exit 1
      fi

      rm -f "$ERR_FILE"

      if [[ "$MODO" == "update" ]]; then
        whiptail --title "$TITLE" \
          --msgbox "Operações concluídas com sucesso!\n\n  ✔ git add .\n  ✔ git commit\n  ✔ git push origin master\n  ✔ git tag $UPDATE_TAG\n  ✔ git push origin $UPDATE_TAG" \
          14 65 \
          --ok-button "Sair"
        clear
        echo -e "\033[0;32m✔ Commit concluído: $COMMIT_MSG\033[0m"
        echo -e "\033[0;32m✔ Tag enviada: $UPDATE_TAG\033[0m"
      else
        whiptail --title "$TITLE" \
          --msgbox "Operações concluídas com sucesso!\n\n  ✔ git add .\n  ✔ git commit\n  ✔ git push origin master" \
          12 65 \
          --ok-button "Sair"
        clear
        echo -e "\033[0;32m✔ Commit concluído: $COMMIT_MSG\033[0m"
      fi
      exit 0
      ;;
  esac
done
