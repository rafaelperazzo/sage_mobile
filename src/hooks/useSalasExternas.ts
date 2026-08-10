import { useState, useEffect, useCallback } from 'react'
import { fetchSalasExternas } from '../lib/supabase'

interface UseSalasExternasReturn {
  salas: string[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useSalasExternas(periodo: string): UseSalasExternasReturn {
  const [salas, setSalas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!periodo) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSalasExternas(periodo)
      setSalas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar salas')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => {
    void load()
  }, [load])

  return { salas, loading, error, reload: load }
}
