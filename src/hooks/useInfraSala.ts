import { useState, useEffect, useCallback } from 'react'
import type { InfraSala, InfraSalaInput } from '../types'
import { fetchInfraSala, updateInfraSala } from '../lib/supabase'

interface UseInfraSalaReturn {
  infra: InfraSala | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  update: (data: InfraSalaInput) => Promise<void>
}

export function useInfraSala(sala: string): UseInfraSalaReturn {
  const [infra, setInfra] = useState<InfraSala | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sala) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchInfraSala(sala)
      setInfra(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar infraestrutura da sala')
    } finally {
      setLoading(false)
    }
  }, [sala])

  useEffect(() => {
    void load()
  }, [load])

  async function update(data: InfraSalaInput) {
    await updateInfraSala(sala, data)
    await load()
  }

  return { infra, loading, error, reload: load, update }
}
