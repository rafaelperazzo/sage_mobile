import { useState } from 'react'
import { Alert } from 'react-native'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { File, Paths } from 'expo-file-system'
import type { ModuloReserva } from '../../../types'
import { normalize } from '../../../lib/normalize'
import { gerarHtmlGrade, type PaginaGrade } from './gradeHtml'

// A4 paisagem em pontos (1pt = 1/72")
const A4_PAISAGEM = { width: 842, height: 595 }

// "CEGOE - SALA 05" → "CEGOE-SALA-05" (sem acentos/caracteres especiais, seguro para nome de arquivo)
function slug(s: string): string {
  return normalize(s)
    .toUpperCase()
    .replace(/[^A-Z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function nomeArquivoGrade(modulo: ModuloReserva, alvo: string, periodo: string): string {
  const sistema = modulo === 'map' ? 'SAGE-Map' : 'SAGE-Rural'
  return `${sistema}_${slug(alvo)}_${periodo}.pdf`
}

// Gera o PDF a partir do HTML e abre a folha de compartilhamento do sistema
export async function exportarGradePdf(html: string, nomeArquivo: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, ...A4_PAISAGEM })

  // O expo-print gera um nome aleatório; renomeia para algo legível para quem recebe o arquivo
  const destino = new File(Paths.cache, nomeArquivo)
  if (destino.exists) destino.delete()
  const gerado = new File(uri)
  gerado.move(destino)

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento não disponível neste dispositivo.')
  }
  await Sharing.shareAsync(destino.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartilhar grade',
  })
}

interface ExportarOptions {
  modulo: ModuloReserva
  periodo: string
  paginas: PaginaGrade[]
  nomeArquivo: string
  predio?: string
}

export function useExportarGrade() {
  const [exportando, setExportando] = useState(false)

  async function exportar({ modulo, periodo, paginas, nomeArquivo, predio }: ExportarOptions) {
    if (exportando) return
    setExportando(true)
    try {
      const html = gerarHtmlGrade({ modulo, periodo, paginas, predio })
      await exportarGradePdf(html, nomeArquivo)
    } catch (err) {
      Alert.alert('Erro ao exportar', err instanceof Error ? err.message : 'Não foi possível gerar o PDF.')
    } finally {
      setExportando(false)
    }
  }

  return { exportar, exportando }
}
