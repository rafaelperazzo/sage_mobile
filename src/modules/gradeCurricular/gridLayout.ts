import type { Alocacao } from '../../types'

export interface LaidOutItem {
  alocacao: Alocacao
  col: number
  totalCols: number
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

interface ClusterItem {
  alocacao: Alocacao
  start: number
  end: number
  col: number
}

/**
 * Agrupa alocações de um único dia em clusters de sobreposição transitiva e
 * atribui a cada uma uma coluna (lane), para renderização lado a lado.
 * Diferente do Sage Map (por sala, sem sobreposição garantida), a grade
 * curricular agrupa por curso+semestre e pode ter disciplinas eletivas em
 * paralelo, em salas diferentes, no mesmo dia/horário.
 */
export function layoutDayEvents(alocacoes: Alocacao[]): LaidOutItem[] {
  const sorted = [...alocacoes].sort((a, b) => timeToMinutes(a.inicio) - timeToMinutes(b.inicio))

  const result: LaidOutItem[] = []
  let cluster: ClusterItem[] = []
  let clusterEnd = -Infinity

  function flushCluster() {
    if (cluster.length === 0) return
    const totalCols = Math.max(...cluster.map((i) => i.col)) + 1
    for (const item of cluster) {
      result.push({ alocacao: item.alocacao, col: item.col, totalCols })
    }
    cluster = []
  }

  for (const alocacao of sorted) {
    const start = timeToMinutes(alocacao.inicio)
    const end = timeToMinutes(alocacao.fim)

    if (start >= clusterEnd) {
      flushCluster()
      clusterEnd = end
    } else {
      clusterEnd = Math.max(clusterEnd, end)
    }

    let col = 0
    while (cluster.some((i) => i.col === col && i.end > start)) col++

    cluster.push({ alocacao, start, end, col })
  }
  flushCluster()

  return result
}
