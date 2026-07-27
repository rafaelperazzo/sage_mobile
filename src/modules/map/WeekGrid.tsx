import { useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import type { Alocacao } from '../../types'
import { DIAS, HORAS } from '../../constants/salas'
import { timeToMinutes } from './gridUtils'
import { AllocationCard } from './AllocationCard'

const ROW_HEIGHT = 52
const COL_WIDTH = 96
const HOUR_COL_WIDTH = 44
const HEADER_H = 32
const FIRST_HOUR = 7 // 07:00

// Sage Map exibe apenas dias úteis (segunda a sexta) na grid
const DIAS_UTEIS = DIAS.filter((d) => d !== 'SÁBADO')

// Pares de horas candidatos a formar um bloco livre de 2h (ancorados, quando ambos livres)
const BLOCOS_LIVRE_2H: [string, string][] = [
  ['08:00', '09:00'],
  ['10:00', '11:00'],
  ['14:00', '15:00'],
  ['16:00', '17:00'],
  ['18:00', '19:00'],
  ['20:00', '21:00'],
]

// Mapeia Date.getDay() (0=domingo) para o rótulo de dia usado em DIAS
const DIA_POR_GETDAY: Record<number, string | undefined> = {
  0: undefined,
  1: 'SEGUNDA',
  2: 'TERÇA',
  3: 'QUARTA',
  4: 'QUINTA',
  5: 'SEXTA',
  6: 'SÁBADO',
}

function nextHour(hora: string): string {
  const h = Number(hora.slice(0, 2))
  return `${String(h + 1).padStart(2, '0')}:00`
}

interface WeekGridProps {
  alocacoes: Alocacao[]
  isAdmin: boolean
  onCellPress: (alocacao: Alocacao) => void
  onEmptyCellPress: (dia: string, hora: string) => void
}

const DIA_SHORT: Record<string, string> = {
  SEGUNDA: 'SEG',
  TERÇA: 'TER',
  QUARTA: 'QUA',
  QUINTA: 'QUI',
  SEXTA: 'SEX',
  SÁBADO: 'SÁB',
}

export function WeekGrid({ alocacoes, isAdmin, onCellPress, onEmptyCellPress }: WeekGridProps) {
  const scrollRef = useRef<ScrollView>(null)
  const totalGridH = HORAS.length * ROW_HEIGHT

  // Agrupar alocações por dia
  const byDia: Record<string, Alocacao[]> = {}
  for (const dia of DIAS) byDia[dia] = []
  for (const a of alocacoes) {
    if (byDia[a.dia_semana]) byDia[a.dia_semana]!.push(a)
  }

  const now = new Date()
  const diaHoje = DIA_POR_GETDAY[now.getDay()]
  const nowMin = now.getHours() * 60 + now.getMinutes()

  function isHourOccupied(dia: string, hora: string): boolean {
    const hMin = timeToMinutes(hora)
    return (byDia[dia] ?? []).some((a) => {
      const s = timeToMinutes(a.inicio)
      const e = timeToMinutes(a.fim)
      return s < hMin + 60 && e > hMin
    })
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
      {DIAS_UTEIS.map((dia) => (
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
            {/* Células vazias */}
            {HORAS.map((hora, idx) => (
              <TouchableOpacity
                key={hora}
                activeOpacity={isAdmin ? 0.5 : 1}
                style={{
                  position: 'absolute',
                  top: idx * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                  width: COL_WIDTH,
                  borderBottomWidth: 0.5,
                  borderBottomColor: '#F3F4F6',
                }}
                onPress={() => {
                  if (isAdmin) onEmptyCellPress(dia, hora)
                }}
              />
            ))}

            {/* Slots livres — destacados, agrupados de 2 em 2h quando possível */}
            {BLOCOS_LIVRE_2H.flatMap(([h1, h2]) => {
              const livre1 = !isHourOccupied(dia, h1)
              const livre2 = !isHourOccupied(dia, h2)
              const idx1 = HORAS.indexOf(h1)
              const idx2 = HORAS.indexOf(h2)

              if (livre1 && livre2) {
                return [
                  <FreeSlot
                    key={`${dia}-${h1}`}
                    top={idx1 * ROW_HEIGHT}
                    height={ROW_HEIGHT * 2 - 2}
                    label={`${h1}-${nextHour(h2)}`}
                    isAdmin={isAdmin}
                    onPress={() => onEmptyCellPress(dia, h1)}
                  />,
                ]
              }

              const slots = []
              if (livre1) {
                slots.push(
                  <FreeSlot
                    key={`${dia}-${h1}`}
                    top={idx1 * ROW_HEIGHT}
                    height={ROW_HEIGHT - 2}
                    label={`${h1}-${nextHour(h1)}`}
                    isAdmin={isAdmin}
                    onPress={() => onEmptyCellPress(dia, h1)}
                  />
                )
              }
              if (livre2) {
                slots.push(
                  <FreeSlot
                    key={`${dia}-${h2}`}
                    top={idx2 * ROW_HEIGHT}
                    height={ROW_HEIGHT - 2}
                    label={`${h2}-${nextHour(h2)}`}
                    isAdmin={isAdmin}
                    onPress={() => onEmptyCellPress(dia, h2)}
                  />
                )
              }
              return slots
            })}

            {/* Blocos de alocação — absolute, altura proporcional */}
            {byDia[dia]?.map((alocacao) => {
              const inicioMin = timeToMinutes(alocacao.inicio)
              const fimMin = timeToMinutes(alocacao.fim)
              const topOffset = (inicioMin / 60 - FIRST_HOUR) * ROW_HEIGHT
              const height = ((fimMin - inicioMin) / 60) * ROW_HEIGHT - 2
              const isCurrent = dia === diaHoje && nowMin >= inicioMin && nowMin < fimMin

              return (
                <TouchableOpacity
                  key={alocacao.id}
                  style={{
                    position: 'absolute',
                    top: topOffset,
                    height: Math.max(height, ROW_HEIGHT - 4),
                    width: COL_WIDTH - 6,
                    left: 3,
                  }}
                  onPress={() => onCellPress(alocacao)}
                  activeOpacity={0.7}
                >
                  <AllocationCard alocacao={alocacao} compact isCurrent={isCurrent} />
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

function FreeSlot({
  top,
  height,
  label,
  isAdmin,
  onPress,
}: {
  top: number
  height: number
  label: string
  isAdmin: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={{
        position: 'absolute',
        top,
        height,
        width: COL_WIDTH - 6,
        left: 3,
        backgroundColor: '#ECFEFF',
        borderWidth: 1,
        borderColor: '#A5F3FC',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      activeOpacity={isAdmin ? 0.6 : 1}
      onPress={() => {
        if (isAdmin) onPress()
      }}
    >
      <Text style={{ fontSize: 9, fontWeight: '700', color: '#0E7490' }}>LIVRE</Text>
      <Text style={{ fontSize: 8, color: '#0891B2', marginTop: 1 }}>{label}</Text>
    </TouchableOpacity>
  )
}
