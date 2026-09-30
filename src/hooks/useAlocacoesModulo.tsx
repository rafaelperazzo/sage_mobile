import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { router } from 'expo-router'
import type { Alocacao, AlocacaoInput, ModuloReserva, ReservaPontual } from '../types'
import {
  insertAlocacoes,
  updateAlocacao,
  deleteAlocacoes,
  insertAlocacoesExternas,
  updateAlocacaoExterna,
  deleteAlocacoesExternas,
  fetchReservasPontuaisFuturasModulo,
} from '../lib/supabase'
import { SALAS } from '../constants/salas'
import { usePeriodo } from '../contexts/PeriodoContext'
import { useAuthContext } from '../contexts/AuthContext'
import { useAlocacoesPorPeriodo } from './useAlocacoes'
import { useAlocacoesExternas } from './useAlocacoesExternas'
import { usePeriodoExterna } from './usePeriodoExterna'
import { useSalasExternas } from './useSalasExternas'
import { useModulePermission } from './useModulePermission'
import { hojeYMD } from '../modules/map/gridUtils'

export interface ModuloContexto {
  modulo: ModuloReserva
  periodo: string
  alocacoes: Alocacao[]              // todas as alocações do período (qualquer sala)
  reservas: ReservaPontual[]         // reservas pontuais futuras do módulo (qualquer sala)
  salas: string[]
  cursos: string[]                   // cursos já usados nas alocações do período (siglas)
  loading: boolean
  canEdit: boolean
  accent: { color: string; disabled: string }
  reload: () => Promise<void>
  insertMany: (inputs: AlocacaoInput[]) => Promise<void>
  updateMany: (items: { id: number; input: AlocacaoInput }[]) => Promise<void>
  removeMany: (ids: number[]) => Promise<void>
}

const ACCENT: Record<ModuloReserva, { color: string; disabled: string }> = {
  map: { color: '#2563EB', disabled: '#93C5FD' },
  rural: { color: '#0E7490', disabled: '#67E8F9' },
}

function useCursos(alocacoes: Alocacao[]): string[] {
  return useMemo(
    () => Array.from(new Set(alocacoes.map((a) => a.curso?.trim()).filter((c): c is string => !!c))).sort(),
    [alocacoes]
  )
}

function useReservasFuturasModulo(modulo: ModuloReserva) {
  const [reservas, setReservas] = useState<ReservaPontual[]>([])

  const load = useCallback(async () => {
    try {
      setReservas(await fetchReservasPontuaisFuturasModulo(modulo, hojeYMD()))
    } catch (err) {
      console.error(err)
    }
  }, [modulo])

  useEffect(() => {
    void load()
  }, [load])

  return { reservas, reload: load }
}

// Volta a tela anterior quando o usuário não tem permissão de edição no módulo
function useExigirPermissao(canEdit: boolean, checking: boolean) {
  useEffect(() => {
    if (!checking && !canEdit) router.back()
  }, [checking, canEdit])
}

export function useContextoMap(): ModuloContexto {
  const { isAdmin } = useAuthContext()
  const { periodo } = usePeriodo()
  const { alocacoes, loading, reload } = useAlocacoesPorPeriodo(periodo)
  const { reservas, reload: reloadReservas } = useReservasFuturasModulo('map')
  const cursos = useCursos(alocacoes)
  useExigirPermissao(isAdmin, false)

  return {
    modulo: 'map',
    periodo,
    alocacoes,
    reservas,
    salas: SALAS.map((s) => s.nome),
    cursos,
    loading,
    canEdit: isAdmin,
    accent: ACCENT.map,
    reload: async () => { await Promise.all([reload(), reloadReservas()]) },
    insertMany: async (inputs) => { await insertAlocacoes(inputs, periodo); await reload() },
    updateMany: async (items) => {
      for (const { id, input } of items) await updateAlocacao(id, input)
      await reload()
    },
    removeMany: async (ids) => { await deleteAlocacoes(ids); await reload() },
  }
}

export function useContextoRural(): ModuloContexto {
  const { hasAccess, loading: loadingAccess } = useModulePermission('rural')
  const { periodo } = usePeriodoExterna()
  const { salas } = useSalasExternas(periodo)
  const { alocacoes, loading, reload } = useAlocacoesExternas(periodo)
  const { reservas, reload: reloadReservas } = useReservasFuturasModulo('rural')
  const cursos = useCursos(alocacoes)
  useExigirPermissao(hasAccess, loadingAccess)

  return {
    modulo: 'rural',
    periodo,
    alocacoes,
    reservas,
    salas,
    cursos,
    loading,
    canEdit: hasAccess,
    accent: ACCENT.rural,
    reload: async () => { await Promise.all([reload(), reloadReservas()]) },
    insertMany: async (inputs) => { await insertAlocacoesExternas(inputs, periodo); await reload() },
    updateMany: async (items) => {
      for (const { id, input } of items) await updateAlocacaoExterna(id, input)
      await reload()
    },
    removeMany: async (ids) => { await deleteAlocacoesExternas(ids); await reload() },
  }
}

// Escolhe o hook do módulo sem chamar o do outro (evita carregar a tabela `externas` no Map e vice-versa).
// O `modulo` de uma tela não muda durante sua vida, então a troca de componente é segura.
function ContextoMap({ render }: { render: (ctx: ModuloContexto) => ReactNode }) {
  return <>{render(useContextoMap())}</>
}

function ContextoRural({ render }: { render: (ctx: ModuloContexto) => ReactNode }) {
  return <>{render(useContextoRural())}</>
}

export function ComModulo({ modulo, render }: { modulo: ModuloReserva; render: (ctx: ModuloContexto) => ReactNode }) {
  return modulo === 'map' ? <ContextoMap render={render} /> : <ContextoRural render={render} />
}
