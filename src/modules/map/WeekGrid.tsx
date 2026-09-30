import { useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import type { Alocacao, ReservaPontual } from '../../types'
import { DIAS, HORAS } from '../../constants/salas'
import { timeToMinutes, minutesToTime, DIA_POR_GETDAY, diaSemanaDeData, intervalosSobrepoem } from './gridUtils'
import { AllocationCard } from './AllocationCard'

const ROW_HEIGHT = 52
const COL_WIDTH = 96
const HOUR_COL_WIDTH = 44
const HEADER_H = 32
const FIRST_HOUR = 7 // 07:00

// Sage Map exibe apenas dias úteis (segunda a sexta) na grid
const DIAS_UTEIS = DIAS.filter((d) => d !== 'SÁBADO')

// Pares de horas candidatos a formar um bloco livre de 2h (ancorados, quando ambos livres).
// Cobre só o período diurno — o noturno usa cálculo exato de frestas (nightFreeGaps),
// já que as aulas de lá não começam/terminam em hora cheia.
const BLOCOS_LIVRE_2H: [string, string][] = [
  ['08:00', '09:00'],
  ['10:00', '11:00'],
  ['14:00', '15:00'],
  ['16:00', '17:00'],
]

// Janela noturna considerada para o cálculo exato de horários livres
const NIGHT_START_MIN = 18 * 60 + 30 // 18:30
const NIGHT_END_MIN = 21 * 60 + 50   // 21:50
const MIN_GAP_MIN = 10 // ignora frestas menores que isso — pouco úteis para alocar aula

function nextHour(hora: string): string {
  const h = Number(hora.slice(0, 2))
  return `${String(h + 1).padStart(2, '0')}:00`
}

interface WeekGridProps {
  alocacoes: Alocacao[]
  reservas?: ReservaPontual[]
  isAdmin: boolean
  onCellPress: (alocacao: Alocacao) => void
  onEmptyCellPress: (dia: string, inicio: string, fim: string) => void
  onReservasPress?: (dia: string, inicio: string, fim: string) => void
}

// Slot livre desenhado na grade (bloco diurno de 1–2h, fresta noturna, ou hora avulsa com reservas)
interface SlotLivre {
  key: string
  inicio: string
  fim: string
  top: number
  height: number
}

// Reservas pontuais que caem num slot (mesmo dia da semana e horário sobreposto)
export function reservasNoSlot(reservas: ReservaPontual[], dia: string, inicio: string, fim: string): ReservaPontual[] {
  return reservas.filter(
    (r) => diaSemanaDeData(r.data) === dia && intervalosSobrepoem(r.inicio, r.fim, inicio, fim)
  )
}

const DIA_SHORT: Record<string, string> = {
  SEGUNDA: 'SEG',
  TERÇA: 'TER',
  QUARTA: 'QUA',
  QUINTA: 'QUI',
  SEXTA: 'SEX',
  SÁBADO: 'SÁB',
}

export function WeekGrid({ alocacoes, reservas = [], isAdmin, onCellPress, onEmptyCellPress, onReservasPress }: WeekGridProps) {
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

  // Frestas livres reais dentro da janela noturna (18:30–21:50), calculadas a partir dos
  // horários exatos das alocações — não aproxima por hora cheia como o restante do dia.
  function nightFreeGaps(dia: string): { start: number; end: number }[] {
    const ocupados = (byDia[dia] ?? [])
      .map((a) => ({
        start: Math.max(timeToMinutes(a.inicio), NIGHT_START_MIN),
        end: Math.min(timeToMinutes(a.fim), NIGHT_END_MIN),
      }))
      .filter((i) => i.start < i.end)
      .sort((a, b) => a.start - b.start)

    const gaps: { start: number; end: number }[] = []
    let cursor = NIGHT_START_MIN
    for (const { start, end } of ocupados) {
      if (start > cursor) gaps.push({ start: cursor, end: start })
      cursor = Math.max(cursor, end)
    }
    if (cursor < NIGHT_END_MIN) gaps.push({ start: cursor, end: NIGHT_END_MIN })

    return gaps.filter((g) => g.end - g.start >= MIN_GAP_MIN)
  }

  function slotAt(key: string, inicioMin: number, fimMin: number): SlotLivre {
    return {
      key,
      inicio: minutesToTime(inicioMin),
      fim: minutesToTime(fimMin),
      top: (inicioMin / 60 - FIRST_HOUR) * ROW_HEIGHT,
      height: ((fimMin - inicioMin) / 60) * ROW_HEIGHT - 2,
    }
  }

  // Slots livres destacados do dia: blocos diurnos (agrupados de 2 em 2h quando possível),
  // frestas noturnas exatas e, por fim, horas avulsas livres que tenham reservas pontuais.
  function slotsLivres(dia: string): SlotLivre[] {
    const slots: SlotLivre[] = []

    for (const [h1, h2] of BLOCOS_LIVRE_2H) {
      const livre1 = !isHourOccupied(dia, h1)
      const livre2 = !isHourOccupied(dia, h2)
      const m1 = timeToMinutes(h1)
      const m2 = timeToMinutes(h2)
      if (livre1 && livre2) {
        slots.push(slotAt(`${dia}-${h1}`, m1, m2 + 60))
        continue
      }
      if (livre1) slots.push(slotAt(`${dia}-${h1}`, m1, m1 + 60))
      if (livre2) slots.push(slotAt(`${dia}-${h2}`, m2, m2 + 60))
    }

    for (const gap of nightFreeGaps(dia)) {
      slots.push(slotAt(`${dia}-night-${gap.start}`, gap.start, gap.end))
    }

    // Horas fora dos blocos acima (07h, 12h, 13h...) só ganham destaque se tiverem reservas
    for (const hora of HORAS) {
      const hMin = timeToMinutes(hora)
      if (isHourOccupied(dia, hora)) continue
      const coberta = slots.some((s) => timeToMinutes(s.inicio) < hMin + 60 && timeToMinutes(s.fim) > hMin)
      if (coberta) continue
      if (reservasNoSlot(reservas, dia, hora, nextHour(hora)).length > 0) {
        slots.push(slotAt(`${dia}-avulsa-${hora}`, hMin, hMin + 60))
      }
    }

    return slots
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
                  if (isAdmin) onEmptyCellPress(dia, hora, nextHour(hora))
                }}
              />
            ))}

            {/* Slots livres — destacados; viram VER RESERVAS quando há reservas pontuais futuras */}
            {slotsLivres(dia).map((slot) => {
              const qtdReservas = reservasNoSlot(reservas, dia, slot.inicio, slot.fim).length
              return (
                <FreeSlot
                  key={slot.key}
                  top={slot.top}
                  height={slot.height}
                  label={`${slot.inicio}-${slot.fim}`}
                  isAdmin={isAdmin}
                  reservasCount={qtdReservas}
                  onPress={() => onEmptyCellPress(dia, slot.inicio, slot.fim)}
                  onReservasPress={() => onReservasPress?.(dia, slot.inicio, slot.fim)}
                />
              )
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
  reservasCount,
  onPress,
  onReservasPress,
}: {
  top: number
  height: number
  label: string
  isAdmin: boolean
  reservasCount: number
  onPress: () => void
  onReservasPress: () => void
}) {
  const temReservas = reservasCount > 0
  return (
    <TouchableOpacity
      style={{
        position: 'absolute',
        top,
        height,
        width: COL_WIDTH - 6,
        left: 3,
        backgroundColor: temReservas ? '#FFFBEB' : '#ECFEFF',
        borderWidth: 1,
        borderColor: temReservas ? '#FCD34D' : '#A5F3FC',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      activeOpacity={temReservas || isAdmin ? 0.6 : 1}
      onPress={() => {
        // VER RESERVAS abre para todos; slot livre sem reservas só reage para admin
        if (temReservas) onReservasPress()
        else if (isAdmin) onPress()
      }}
    >
      {temReservas ? (
        <>
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#B45309' }}>VER RESERVAS</Text>
          <Text style={{ fontSize: 8, color: '#D97706', marginTop: 1 }}>
            {reservasCount} · {label}
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#0E7490' }}>LIVRE</Text>
          <Text style={{ fontSize: 8, color: '#0891B2', marginTop: 1 }}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}
