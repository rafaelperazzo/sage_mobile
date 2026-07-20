import { useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import type { Alocacao } from '../../types'
import { DIAS, HORAS } from '../../constants/salas'
import { AllocationCard } from '../map/AllocationCard'
import { layoutDayEvents } from './gridLayout'

const ROW_HEIGHT = 52
const COL_WIDTH = 140
const HOUR_COL_WIDTH = 44
const HEADER_H = 32
const FIRST_HOUR = 7 // 07:00

interface CurricularGridProps {
  alocacoes: Alocacao[]
  onCellPress: (alocacao: Alocacao) => void
}

const DIA_SHORT: Record<string, string> = {
  SEGUNDA: 'SEG',
  TERÇA: 'TER',
  QUARTA: 'QUA',
  QUINTA: 'QUI',
  SEXTA: 'SEX',
  SÁBADO: 'SÁB',
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function CurricularGrid({ alocacoes, onCellPress }: CurricularGridProps) {
  const scrollRef = useRef<ScrollView>(null)
  const totalGridH = HORAS.length * ROW_HEIGHT

  const byDia: Record<string, Alocacao[]> = {}
  for (const dia of DIAS) byDia[dia] = []
  for (const a of alocacoes) {
    if (byDia[a.dia_semana]) byDia[a.dia_semana]!.push(a)
  }

  const totalH = totalGridH + HEADER_H

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator
      style={{ height: totalH }}
      contentContainerStyle={{ flexDirection: 'row' }}
    >
      {/* Coluna de horas */}
      <View style={{ width: HOUR_COL_WIDTH }}>
        <View style={{ height: HEADER_H }} />
        {HORAS.map((hora) => (
          <View
            key={hora}
            style={{
              height: ROW_HEIGHT,
              justifyContent: 'flex-start',
              alignItems: 'center',
              paddingTop: 3,
            }}
          >
            <Text style={{ fontSize: 9, color: '#9CA3AF', fontFamily: 'monospace' }}>
              {hora}
            </Text>
          </View>
        ))}
      </View>

      {/* Colunas dos dias */}
      {DIAS.map((dia) => {
        const laidOut = layoutDayEvents(byDia[dia] ?? [])

        return (
          <View key={dia} style={{ width: COL_WIDTH }}>
            {/* Cabeçalho do dia */}
            <View
              style={{
                height: HEADER_H,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
                borderLeftWidth: 1,
                borderLeftColor: '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#374151' }}>
                {DIA_SHORT[dia]}
              </Text>
            </View>

            {/* Área da grade — relative container */}
            <View
              style={{
                position: 'relative',
                height: totalGridH,
                borderLeftWidth: 1,
                borderLeftColor: '#E5E7EB',
              }}
            >
              {/* Linhas de hora (visuais, sem interação) */}
              {HORAS.map((hora, idx) => (
                <View
                  key={hora}
                  style={{
                    position: 'absolute',
                    top: idx * ROW_HEIGHT,
                    height: ROW_HEIGHT,
                    width: COL_WIDTH,
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#F3F4F6',
                  }}
                />
              ))}

              {/* Blocos de alocação — absolute, com colunas lado a lado quando há sobreposição */}
              {laidOut.map(({ alocacao, col, totalCols }) => {
                const inicioMin = timeToMinutes(alocacao.inicio)
                const fimMin = timeToMinutes(alocacao.fim)
                const topOffset = (inicioMin / 60 - FIRST_HOUR) * ROW_HEIGHT
                const height = ((fimMin - inicioMin) / 60) * ROW_HEIGHT - 2

                const laneWidth = (COL_WIDTH - 6) / totalCols

                return (
                  <TouchableOpacity
                    key={alocacao.id}
                    style={{
                      position: 'absolute',
                      top: topOffset,
                      height: Math.max(height, ROW_HEIGHT - 4),
                      width: laneWidth - 2,
                      left: 3 + col * laneWidth,
                    }}
                    onPress={() => onCellPress(alocacao)}
                    activeOpacity={0.7}
                  >
                    <AllocationCard alocacao={alocacao} compact showSala />
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )
      })}
    </ScrollView>
  )
}
