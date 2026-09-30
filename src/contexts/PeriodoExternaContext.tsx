import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { fetchPeriodosExternas } from '../lib/supabase'

interface PeriodoExternaContextValue {
  periodo: string
  setPeriodo: (p: string) => void
  periodos: string[]
  loadingPeriodos: boolean
  solicitar: () => void
}

const PeriodoExternaContext = createContext<PeriodoExternaContextValue | null>(null)

// Período selecionado no SAGE Rural, compartilhado entre a grade e as telas de criação/edição
// (equivalente ao PeriodoContext do SAGE Map). A lista de períodos só é buscada quando alguma
// tela a solicita, já que exige paginar a tabela `externas`.
export function PeriodoExternaProvider({ children }: { children: ReactNode }) {
  const [solicitado, setSolicitado] = useState(false)
  const [periodos, setPeriodos] = useState<string[]>([])
  const [periodo, setPeriodo] = useState<string>('')
  const [loadingPeriodos, setLoadingPeriodos] = useState(true)

  useEffect(() => {
    if (!solicitado) return
    fetchPeriodosExternas()
      .then((lista) => {
        setPeriodos(lista)
        if (lista.length === 0) return
        const now = new Date()
        const semestre = now.getMonth() + 1 <= 7 ? 1 : 2
        const periodoAtual = `${now.getFullYear()}.${semestre}`
        const match = lista.includes(periodoAtual) ? periodoAtual : lista[lista.length - 1]!
        setPeriodo(match)
      })
      .catch(console.error)
      .finally(() => setLoadingPeriodos(false))
  }, [solicitado])

  const solicitar = useCallback(() => setSolicitado(true), [])

  return (
    <PeriodoExternaContext.Provider value={{ periodo, setPeriodo, periodos, loadingPeriodos, solicitar }}>
      {children}
    </PeriodoExternaContext.Provider>
  )
}

export function usePeriodoExterna(): Omit<PeriodoExternaContextValue, 'solicitar'> {
  const ctx = useContext(PeriodoExternaContext)
  if (!ctx) throw new Error('usePeriodoExterna deve ser usado dentro de PeriodoExternaProvider')
  const { solicitar, ...rest } = ctx
  useEffect(() => {
    solicitar()
  }, [solicitar])
  return rest
}
