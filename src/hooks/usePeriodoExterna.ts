import { useState, useEffect } from 'react'
import { fetchPeriodosExternas } from '../lib/supabase'

interface UsePeriodoExternaReturn {
  periodo: string
  setPeriodo: (p: string) => void
  periodos: string[]
  loadingPeriodos: boolean
}

export function usePeriodoExterna(): UsePeriodoExternaReturn {
  const [periodos, setPeriodos] = useState<string[]>([])
  const [periodo, setPeriodo] = useState<string>('')
  const [loadingPeriodos, setLoadingPeriodos] = useState(true)

  useEffect(() => {
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
  }, [])

  return { periodo, setPeriodo, periodos, loadingPeriodos }
}
