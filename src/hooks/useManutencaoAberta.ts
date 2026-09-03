import { useState, useEffect, useCallback } from 'react'
import type { Manutencao } from '../types'
import { fetchManutencoesAbertasPorSala } from '../lib/supabase'

interface UseManutencaoAbertaReturn {
  manutencoes: Manutencao[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useManutencaoAberta(sala: string): UseManutencaoAbertaReturn {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sala) {
      setManutencoes([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const data = await fetchManutencoesAbertasPorSala(sala)
      setManutencoes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar chamados de manutenção')
    } finally {
      setLoading(false)
    }
  }, [sala])

  useEffect(() => {
    void load()
  }, [load])

  return { manutencoes, loading, error, reload: load }
}
