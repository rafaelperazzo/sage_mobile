import { useState, useEffect, useCallback } from 'react'
import type { Alocacao, ModuloReserva, ReservaPontual, ReservaPontualInput } from '../types'
import {
  fetchReservasPontuaisFuturas,
  insertReservaPontual,
  updateReservaPontual,
  deleteReservaPontual,
} from '../lib/supabase'
import { hojeYMD, diaSemanaDeData, intervalosSobrepoem } from '../modules/map/gridUtils'

export type ConflitoReserva = 'alocacao' | 'reserva' | null

export const MENSAGEM_CONFLITO: Record<'alocacao' | 'reserva', string> = {
  alocacao: 'Conflito de horário com uma alocação da sala.',
  reserva: 'Conflito de horário com outra reserva nesta data.',
}

interface UseReservasPontuaisReturn {
  reservas: ReservaPontual[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  create: (data: ReservaPontualInput, alocacoes: Alocacao[]) => Promise<void>
  update: (id: number, data: ReservaPontualInput, alocacoes: Alocacao[]) => Promise<void>
  remove: (id: number) => Promise<void>
  conflito: (data: ReservaPontualInput, alocacoes: Alocacao[], excludeId?: number) => ConflitoReserva
}

// Reservas pontuais futuras (data >= hoje) de uma sala num módulo (SAGE Map / SAGE Rural)
export function useReservasPontuais(sala: string, modulo: ModuloReserva): UseReservasPontuaisReturn {
  const [reservas, setReservas] = useState<ReservaPontual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sala) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchReservasPontuaisFuturas(sala, modulo, hojeYMD())
      setReservas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar reservas')
    } finally {
      setLoading(false)
    }
  }, [sala, modulo])

  useEffect(() => {
    void load()
  }, [load])

  // Reserva só pode ocupar slot livre de alocação e não pode chocar com outra reserva na mesma data
  function conflito(data: ReservaPontualInput, alocacoes: Alocacao[], excludeId?: number): ConflitoReserva {
    const dia = diaSemanaDeData(data.data)
    const chocaAlocacao = alocacoes.some(
      (a) => a.sala === data.sala && a.dia_semana === dia && intervalosSobrepoem(data.inicio, data.fim, a.inicio, a.fim)
    )
    if (chocaAlocacao) return 'alocacao'

    const chocaReserva = reservas
      .filter((r) => excludeId === undefined || r.id !== excludeId)
      .some((r) => r.data === data.data && intervalosSobrepoem(data.inicio, data.fim, r.inicio, r.fim))
    if (chocaReserva) return 'reserva'

    return null
  }

  async function create(data: ReservaPontualInput, alocacoes: Alocacao[]) {
    const c = conflito(data, alocacoes)
    if (c) throw new Error(MENSAGEM_CONFLITO[c])
    await insertReservaPontual(data)
    await load()
  }

  async function update(id: number, data: ReservaPontualInput, alocacoes: Alocacao[]) {
    const c = conflito(data, alocacoes, id)
    if (c) throw new Error(MENSAGEM_CONFLITO[c])
    await updateReservaPontual(id, data)
    await load()
  }

  async function remove(id: number) {
    await deleteReservaPontual(id)
    await load()
  }

  return { reservas, loading, error, reload: load, create, update, remove, conflito }
}
