import type { SalaInfo, TipoSala } from '../types'

export const SALAS: SalaInfo[] = [
  { nome: 'SALA 02', tipo: 'sala_aula' },
  { nome: 'SALA 03', tipo: 'sala_aula' },
  { nome: 'SALA 36', tipo: 'sala_aula' },
  { nome: 'SALA 38', tipo: 'sala_aula' },
  { nome: 'SALA 40', tipo: 'sala_inovacao' },
  { nome: 'SALA 42', tipo: 'sala_inovacao' },
  { nome: 'LAB 35', tipo: 'laboratorio' },
  { nome: 'LAB 37', tipo: 'laboratorio' },
  { nome: 'LAB 39', tipo: 'laboratorio' },
  { nome: 'LAB 41', tipo: 'laboratorio' },
  { nome: 'LAB 43', tipo: 'laboratorio' },
  { nome: 'LAB CEAGRI I - 10', tipo: 'laboratorio' },
  { nome: 'LAB CEAGRI I - 15', tipo: 'laboratorio' },
]

export const DIAS = [
  'SEGUNDA',
  'TERÇA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SÁBADO',
] as const

export type DiaSemana = (typeof DIAS)[number]

// Slots de 07:00 a 21:00; a última linha cobre 21:00–22:00
export const HORAS: string[] = Array.from({ length: 15 }, (_, i) =>
  `${String(7 + i).padStart(2, '0')}:00`
)

// Opções de horário para os seletores de início/fim de aula (07:00 a 22:00, passo de 10min).
// O passo de 10min cobre tanto o padrão histórico (início na hora cheia) quanto o padrão
// noturno vigente (início às 18:30, aulas de 50min) sem precisar hardcodar um dos dois.
export const TIME_PICKER_OPTIONS: string[] = Array.from({ length: (22 - 7) * 6 + 1 }, (_, i) => {
  const totalMin = 7 * 60 + i * 10
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

export const TIPO_LABEL: Record<TipoSala, string> = {
  sala_aula: 'Sala de Aula',
  sala_inovacao: 'Sala de Inovação',
  laboratorio: 'Laboratório',
}

export const TIPO_COLOR: Record<TipoSala, string> = {
  sala_aula: 'bg-blue-100 text-blue-800 border-blue-200',
  sala_inovacao: 'bg-violet-100 text-violet-800 border-violet-200',
  laboratorio: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export const TIPO_CELL_COLOR: Record<TipoSala, string> = {
  sala_aula: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  sala_inovacao: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
  laboratorio: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
}

export function getSalaInfo(nomeSala: string): SalaInfo | undefined {
  return SALAS.find((s) => s.nome === nomeSala)
}

export const PERIODO_ATUAL = '2026.1'
