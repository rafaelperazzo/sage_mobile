import type { Alocacao } from '../../types'
import { DIAS, HORAS } from '../../constants/salas'

export type GridCellType =
  | { type: 'allocation'; alocacao: Alocacao; rowSpan: number }
  | { type: 'skip' }
  | { type: 'empty'; hora: string; dia: string }

export type GridMatrix = Record<string, Record<string, GridCellType>>

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Mapeia Date.getDay() (0=domingo) para o rótulo de dia usado em DIAS
export const DIA_POR_GETDAY: Record<number, string | undefined> = {
  0: undefined,
  1: 'SEGUNDA',
  2: 'TERÇA',
  3: 'QUARTA',
  4: 'QUINTA',
  5: 'SEXTA',
  6: 'SÁBADO',
}

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Data local de hoje em "YYYY-MM-DD" (sem toISOString, que desloca para UTC)
export function hojeYMD(): string {
  return toYMD(new Date())
}

// "YYYY-MM-DD" → rótulo de dia da semana ("SEGUNDA", ...), ou undefined para domingo/data inválida
export function diaSemanaDeData(ymd: string): string | undefined {
  const d = new Date(ymd + 'T00:00:00')
  if (isNaN(d.getTime())) return undefined
  return DIA_POR_GETDAY[d.getDay()]
}

// Próxima ocorrência (incluindo hoje) do dia da semana informado, em "YYYY-MM-DD"
export function proximaDataDoDia(dia: string): string {
  const d = new Date()
  for (let i = 0; i < 7; i++) {
    if (DIA_POR_GETDAY[d.getDay()] === dia) return toYMD(d)
    d.setDate(d.getDate() + 1)
  }
  return hojeYMD()
}

export function intervalosSobrepoem(aInicio: string, aFim: string, bInicio: string, bFim: string): boolean {
  return timeToMinutes(aInicio) < timeToMinutes(bFim) && timeToMinutes(aFim) > timeToMinutes(bInicio)
}

/**
 * Constrói a matriz de células para o grid semanal.
 * Trata o caso de alocações multi-hora com rowSpan.
 */
export function buildGridMatrix(alocacoes: Alocacao[]): GridMatrix {
  // Inicializar com células vazias
  const matrix: GridMatrix = {}
  for (const hora of HORAS) {
    matrix[hora] = {}
    for (const dia of DIAS) {
      matrix[hora][dia] = { type: 'empty', hora, dia }
    }
  }

  for (const alocacao of alocacoes) {
    const inicioMin = timeToMinutes(alocacao.inicio)
    const fimMin = timeToMinutes(alocacao.fim)
    const rowSpan = Math.round((fimMin - inicioMin) / 60)
    if (rowSpan <= 0) continue

    // Encontrar a linha de início na grade
    const horaInicio = `${String(Math.floor(inicioMin / 60)).padStart(2, '0')}:00`
    const diaIdx = DIAS.indexOf(alocacao.dia_semana as typeof DIAS[number])
    if (diaIdx === -1) continue
    if (!HORAS.includes(horaInicio)) continue

    // Marcar célula de início com a alocação
    matrix[horaInicio]![alocacao.dia_semana] = {
      type: 'allocation',
      alocacao,
      rowSpan,
    }

    // Marcar células subsequentes como 'skip'
    for (let i = 1; i < rowSpan; i++) {
      const nextHora = `${String(Math.floor(inicioMin / 60) + i).padStart(2, '0')}:00`
      if (matrix[nextHora]) {
        matrix[nextHora]![alocacao.dia_semana] = { type: 'skip' }
      }
    }
  }

  return matrix
}
