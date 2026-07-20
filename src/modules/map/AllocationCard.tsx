import { View, Text } from 'react-native'
import type { Alocacao } from '../../types'
import { getSalaInfo } from '../../constants/salas'
import { getCursoColor } from '../../lib/cursoColors'

const TIPO_BG: Record<string, string> = {
  sala_aula: '#EFF6FF',
  sala_inovacao: '#F5F3FF',
  laboratorio: '#ECFDF5',
}

const TIPO_BORDER: Record<string, string> = {
  sala_aula: '#BFDBFE',
  sala_inovacao: '#DDD6FE',
  laboratorio: '#A7F3D0',
}

const TIPO_TEXT: Record<string, string> = {
  sala_aula: '#1D4ED8',
  sala_inovacao: '#6D28D9',
  laboratorio: '#065F46',
}

interface AllocationCardProps {
  alocacao: Alocacao
  compact?: boolean
  showSala?: boolean
}

export function AllocationCard({ alocacao, compact = false, showSala = false }: AllocationCardProps) {
  const info = getSalaInfo(alocacao.sala)
  const tipo = info?.tipo ?? 'sala_aula'
  const cursoColor = getCursoColor(alocacao.curso)
  const bg = cursoColor?.bg ?? TIPO_BG[tipo]!
  const border = cursoColor?.border ?? TIPO_BORDER[tipo]!
  const accent = cursoColor?.accent ?? TIPO_TEXT[tipo]!
  // Texto fica em tinta neutra — a identidade do curso é carregada pelo accent (barra/borda), nunca pelo texto.
  const text = cursoColor ? '#111827' : TIPO_TEXT[tipo]!

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderWidth: compact ? 0 : 1,
        borderColor: border,
        borderLeftWidth: 3,
        borderLeftColor: accent,
        borderRadius: 4,
        padding: compact ? 3 : 6,
        overflow: 'hidden',
      }}
    >
      <Text
        style={{
          fontSize: compact ? 9 : 11,
          fontWeight: '700',
          color: text,
          lineHeight: compact ? 12 : 14,
        }}
        numberOfLines={compact ? 2 : 3}
      >
        {alocacao.disciplina}
      </Text>
      {(!compact || showSala) && alocacao.professor && (
        <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 1 }} numberOfLines={1}>
          {alocacao.professor}
        </Text>
      )}
      {showSala && (
        <Text style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }} numberOfLines={1}>
          {alocacao.sala}
        </Text>
      )}
      {!compact && (
        <Text style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>
          {alocacao.inicio}–{alocacao.fim}
        </Text>
      )}
    </View>
  )
}
