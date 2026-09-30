import type { Alocacao, AlocacaoInput, ReservaPontual } from '../../types'
import { normalize } from '../../lib/normalize'
import { diaSemanaDeData, intervalosSobrepoem, timeToMinutes } from './gridUtils'

function chave(v: string | null | undefined): string | null {
  return v == null ? null : normalize(v.trim())
}

// Mesma disciplina = mesmo nome + mesmo professor + mesmo curso (null só casa com null)
export function mesmaDisciplina(
  a: Pick<Alocacao, 'disciplina' | 'professor' | 'curso'>,
  b: Pick<Alocacao, 'disciplina' | 'professor' | 'curso'>
): boolean {
  return (
    chave(a.disciplina) === chave(b.disciplina) &&
    chave(a.professor) === chave(b.professor) &&
    chave(a.curso) === chave(b.curso)
  )
}

const DIA_ORDEM: Record<string, number> = { SEGUNDA: 0, TERÇA: 1, QUARTA: 2, QUINTA: 3, SEXTA: 4, SÁBADO: 5 }

// Outras alocações (qualquer sala) da mesma disciplina que `alvo`, excluindo o próprio alvo
export function ocorrenciasDaDisciplina(todas: Alocacao[], alvo: Alocacao): Alocacao[] {
  return todas
    .filter((a) => a.id !== alvo.id && mesmaDisciplina(a, alvo))
    .sort((a, b) => (DIA_ORDEM[a.dia_semana] ?? 9) - (DIA_ORDEM[b.dia_semana] ?? 9) || a.inicio.localeCompare(b.inicio))
}

const DIA_SHORT: Record<string, string> = {
  SEGUNDA: 'SEG',
  TERÇA: 'TER',
  QUARTA: 'QUA',
  QUINTA: 'QUI',
  SEXTA: 'SEX',
  SÁBADO: 'SÁB',
}

// "QUA 10:00–12:00 · SALA 02"
export function descreverAlocacao(a: Pick<Alocacao, 'dia_semana' | 'inicio' | 'fim' | 'sala'>): string {
  return `${DIA_SHORT[a.dia_semana] ?? a.dia_semana} ${a.inicio.slice(0, 5)}–${a.fim.slice(0, 5)} · ${a.sala}`
}

function formatDataCurta(ymd: string): string {
  const [, m, d] = ymd.split('-')
  return `${d}/${m}`
}

/**
 * Valida um lote de alocações candidatas (criação múltipla ou alteração refletida).
 * Retorna, para cada candidata, null (ok) ou a mensagem do primeiro problema encontrado.
 * `ignorarIds` são as alocações existentes que estão sendo substituídas pelo lote.
 */
export function conflitosDoLote(
  candidatas: AlocacaoInput[],
  existentes: Alocacao[],
  reservas: ReservaPontual[],
  ignorarIds: number[] = []
): (string | null)[] {
  const outras = existentes.filter((a) => !ignorarIds.includes(a.id))

  return candidatas.map((c, idx) => {
    if (timeToMinutes(c.inicio) >= timeToMinutes(c.fim)) return 'O horário de início deve ser anterior ao fim.'

    const aloc = outras.find(
      (a) => a.sala === c.sala && a.dia_semana === c.dia_semana && intervalosSobrepoem(c.inicio, c.fim, a.inicio, a.fim)
    )
    if (aloc) return `Choque com ${aloc.disciplina} (${descreverAlocacao(aloc)}).`

    const reserva = reservas.find(
      (r) => r.sala === c.sala && diaSemanaDeData(r.data) === c.dia_semana && intervalosSobrepoem(c.inicio, c.fim, r.inicio, r.fim)
    )
    if (reserva) return `Choque com reserva pontual de ${formatDataCurta(reserva.data)} (${reserva.inicio}–${reserva.fim}).`

    const interna = candidatas.findIndex(
      (o, j) => j !== idx && o.sala === c.sala && o.dia_semana === c.dia_semana && intervalosSobrepoem(c.inicio, c.fim, o.inicio, o.fim)
    )
    if (interna !== -1) return `Choque com a alocação ${interna + 1} deste formulário.`

    return null
  })
}
