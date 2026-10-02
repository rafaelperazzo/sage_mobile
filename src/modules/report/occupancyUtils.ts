import type { Alocacao } from '../../types'
import { DIAS } from '../../constants/salas'
import { timeToMinutes, intervalosSobrepoem } from '../map/gridUtils'

export interface RoomOccupancy {
  sala: string
  grupo: string             // tipo da sala (SAGE Map) ou prédio (SAGE Rural) — define cor/agrupamento
  totalHoras: number
  percentual: number        // 0–100
  porDia: Record<string, number>  // dia → horas
}

export interface ReportSummary {
  salas: RoomOccupancy[]
  totalGeralHoras: number
  mediaOcupacao: number
}

export interface SalaRelatorio {
  nome: string
  grupo: string
}

// Relatório considera apenas dias úteis (segunda a sexta)
const DIAS_UTEIS = DIAS.filter((d) => d !== 'SÁBADO')

// Capacidade: manhã 4h + tarde 4h + noite 2 blocos × 2h = 12h por dia × 5 dias úteis = 60h por semana
export const MAX_HORAS_DIA = 12

// Turnos: manhã = antes das 12:00, tarde = 12:00–18:30, noite = blocos noturnos. 4h de capacidade cada.
export type Turno = 'total' | 'manha' | 'tarde' | 'noite'
export const TURNO_LABEL: Record<Turno, string> = { total: 'Total', manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' }
export const MAX_HORAS_TURNO = 4
const MEIO_DIA = timeToMinutes('12:00')

export function maxHorasDia(turno: Turno): number {
  return turno === 'total' ? MAX_HORAS_DIA : MAX_HORAS_TURNO
}

// Blocos noturnos (aulas de 50min × 2). Cada bloco com qualquer uso conta como 2h de ocupação,
// já que a sala fica indisponível para outra turma naquele bloco.
const NIGHT_START = timeToMinutes('18:30')
export const NIGHT_BLOCKS = [
  { inicio: '18:30', fim: '20:10' },
  { inicio: '20:10', fim: '21:50' },
]
const HORAS_POR_BLOCO_NOTURNO = 2

interface Intervalo {
  start: number
  end: number
}

// Soma horas de intervalos sem contar sobreposições (merge de intervalos)
function somarIntervalos(intervals: Intervalo[]): number {
  const ordenados = [...intervals].sort((a, b) => a.start - b.start)
  let minutos = 0
  let currentEnd = -1
  for (const { start, end } of ordenados) {
    if (start >= currentEnd) {
      minutos += end - start
      currentEnd = end
    } else if (end > currentEnd) {
      minutos += end - currentEnd
      currentEnd = end
    }
  }
  return minutos / 60
}

/**
 * Horas ocupadas de uma sala num dia:
 * - antes das 18:30: horas reais (sem dupla contagem de sobreposições);
 * - noite: cada bloco (18:30–20:10, 20:10–21:50) conta 2h se alguma alocação encostar nele.
 * Com `turno`, conta só a parte do dia daquele turno (manhã/tarde recortam os intervalos em 12:00).
 */
export function horasOcupadasNoDia(alocs: Pick<Alocacao, 'inicio' | 'fim'>[], turno: Turno = 'total'): number {
  const horasEntre = (de: number, ate: number) =>
    somarIntervalos(
      alocs
        .map((a) => ({ start: Math.max(timeToMinutes(a.inicio), de), end: Math.min(timeToMinutes(a.fim), ate) }))
        .filter((i) => i.end > i.start)
    )
  const horasNoite = () =>
    NIGHT_BLOCKS.filter((b) => alocs.some((a) => intervalosSobrepoem(a.inicio, a.fim, b.inicio, b.fim))).length *
    HORAS_POR_BLOCO_NOTURNO

  switch (turno) {
    case 'manha': return horasEntre(0, MEIO_DIA)
    case 'tarde': return horasEntre(MEIO_DIA, NIGHT_START)
    case 'noite': return horasNoite()
    case 'total': return horasEntre(0, NIGHT_START) + horasNoite()
  }
}

export function calcularOcupacao(alocacoes: Alocacao[], salasRelatorio: SalaRelatorio[], turno: Turno = 'total'): ReportSummary {
  const maxHorasSemana = maxHorasDia(turno) * DIAS_UTEIS.length
  // Indexa por sala/dia uma vez (Rural tem ~1000 alocações × ~60 salas)
  const porSalaDia = new Map<string, Alocacao[]>()
  for (const a of alocacoes) {
    const key = `${a.sala}|${a.dia_semana}`
    const lista = porSalaDia.get(key)
    if (lista) lista.push(a)
    else porSalaDia.set(key, [a])
  }

  const salas: RoomOccupancy[] = salasRelatorio.map(({ nome, grupo }) => {
    const porDia: Record<string, number> = {}
    let totalHoras = 0

    for (const dia of DIAS_UTEIS) {
      const horasNoDia = horasOcupadasNoDia(porSalaDia.get(`${nome}|${dia}`) ?? [], turno)
      porDia[dia] = horasNoDia
      totalHoras += horasNoDia
    }

    return {
      sala: nome,
      grupo,
      totalHoras,
      percentual: Math.min(100, Math.round((totalHoras / maxHorasSemana) * 100)),
      porDia,
    }
  })

  const totalGeralHoras = salas.reduce((sum, s) => sum + s.totalHoras, 0)
  const mediaOcupacao = salas.length > 0
    ? Math.round(salas.reduce((sum, s) => sum + s.percentual, 0) / salas.length)
    : 0

  return { salas, totalGeralHoras, mediaOcupacao }
}

// Média de ocupação por grupo (prédio, no SAGE Rural), na ordem de primeira aparição
export function mediaPorGrupo(salas: RoomOccupancy[]): { grupo: string; percentual: number; qtdSalas: number }[] {
  const grupos = new Map<string, RoomOccupancy[]>()
  for (const s of salas) {
    const lista = grupos.get(s.grupo)
    if (lista) lista.push(s)
    else grupos.set(s.grupo, [s])
  }
  return Array.from(grupos, ([grupo, lista]) => ({
    grupo,
    qtdSalas: lista.length,
    percentual: Math.round(lista.reduce((sum, s) => sum + s.percentual, 0) / lista.length),
  }))
}
