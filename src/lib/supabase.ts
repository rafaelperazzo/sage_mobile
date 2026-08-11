import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import type { Alocacao, AlocacaoInput, Reserva, ReservaInput, Manutencao, ManutencaoInput, InfraSala, InfraSalaInput } from '../types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY são obrigatórias.')
}

// SecureStore tem limite de ~2KB no iOS; tokens grandes vão para AsyncStorage
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const secureVal = await SecureStore.getItemAsync(key)
    if (secureVal !== null) return secureVal
    return AsyncStorage.getItem(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length > 1800) {
      await AsyncStorage.setItem(key, value)
    } else {
      await SecureStore.setItemAsync(key, value)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key)
    await AsyncStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Nome da tabela — isolado aqui para facilitar manutenção
export const TABLE_NAME = 'alocacao_2026.1'

// ── Períodos letivos ────────────────────────────────────────────

export async function fetchPeriodos(): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('periodo')

  if (error) throw error

  const periodos = Array.from(
    new Set((data as { periodo: string }[]).map((r) => r.periodo).filter(Boolean))
  ).sort()

  return periodos
}

// ── Operações de leitura (filtradas por período) ────────────────

export async function fetchAlocacoes(periodo: string): Promise<Alocacao[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('periodo', periodo)
    .order('dia_semana')
    .order('inicio')

  if (error) throw error
  return data as Alocacao[]
}

export async function fetchAlocacoesPorSala(sala: string, periodo: string): Promise<Alocacao[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('sala', sala)
    .eq('periodo', periodo)
    .order('dia_semana')
    .order('inicio')

  if (error) throw error
  return data as Alocacao[]
}

export async function fetchAlocacaoById(id: number): Promise<Alocacao | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as Alocacao | null
}

// ── Operações CRUD ──────────────────────────────────────────────

export async function insertAlocacao(input: AlocacaoInput, periodo: string): Promise<Alocacao> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({ ...input, periodo })
    .select()
    .single()

  if (error) throw error
  return data as Alocacao
}

export async function updateAlocacao(id: number, input: AlocacaoInput): Promise<Alocacao> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Alocacao
}

export async function deleteAlocacao(id: number): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ── Auditório ───────────────────────────────────────────────────

export const AUDITORIO_TABLE = 'auditorio'

export async function fetchReservasMes(ano: number, mes: number): Promise<Reserva[]> {
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const lastDay = new Date(ano, mes, 0).getDate()
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from(AUDITORIO_TABLE)
    .select('*')
    .gte('data', dataInicio)
    .lte('data', dataFim)
    .order('data')
    .order('inicio')

  if (error) throw error
  return data as Reserva[]
}

export async function insertReserva(input: ReservaInput): Promise<Reserva> {
  const { data, error } = await supabase
    .from(AUDITORIO_TABLE)
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Reserva
}

export async function updateReserva(id: number, input: ReservaInput): Promise<Reserva> {
  const { data, error } = await supabase
    .from(AUDITORIO_TABLE)
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Reserva
}

export async function deleteReserva(id: number): Promise<void> {
  const { error } = await supabase
    .from(AUDITORIO_TABLE)
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ── Manutenção ──────────────────────────────────────────────────

export const MANUTENCAO_TABLE = 'manutencao'

export async function fetchManutencoes(): Promise<Manutencao[]> {
  const { data, error } = await supabase
    .from(MANUTENCAO_TABLE)
    .select('*')
    .order('data_abertura', { ascending: false })

  if (error) throw error
  return data as Manutencao[]
}

export async function insertManutencao(input: ManutencaoInput): Promise<Manutencao> {
  const { data, error } = await supabase
    .from(MANUTENCAO_TABLE)
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Manutencao
}

export async function updateManutencao(id: number, input: ManutencaoInput): Promise<Manutencao> {
  const { data, error } = await supabase
    .from(MANUTENCAO_TABLE)
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Manutencao
}

export async function deleteManutencao(id: number): Promise<void> {
  const { error } = await supabase
    .from(MANUTENCAO_TABLE)
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ── Infraestrutura das salas ────────────────────────────────────

export const INFRA_SALAS_TABLE = 'infra_salas'

export async function fetchInfraSala(sala: string): Promise<InfraSala | null> {
  const { data, error } = await supabase
    .from(INFRA_SALAS_TABLE)
    .select('*')
    .eq('sala', sala)
    .maybeSingle()

  if (error) throw error
  return data as InfraSala | null
}

export async function updateInfraSala(sala: string, input: InfraSalaInput): Promise<InfraSala> {
  const { data, error } = await supabase
    .from(INFRA_SALAS_TABLE)
    .update(input)
    .eq('sala', sala)
    .select()
    .single()

  if (error) throw error
  return data as InfraSala
}

// ── SAGE Rural (tabela externas) ─────────────────────────────────

export const RURAL_TABLE_NAME = 'externas'

// PostgREST limita cada resposta a 1000 linhas por padrão; a tabela `externas`
// já ultrapassa isso, então paginamos com .range() até esgotar os resultados.
const POSTGREST_PAGE_SIZE = 1000

async function fetchAllPages<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const results: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await buildQuery(from, from + POSTGREST_PAGE_SIZE - 1)
    if (error) throw error

    const page = (data ?? []) as T[]
    results.push(...page)

    if (page.length < POSTGREST_PAGE_SIZE) break
    from += POSTGREST_PAGE_SIZE
  }

  return results
}

export async function fetchPeriodosExternas(): Promise<string[]> {
  const data = await fetchAllPages<{ periodo: string }>((from, to) =>
    supabase.from(RURAL_TABLE_NAME).select('periodo').range(from, to)
  )

  const periodos = Array.from(new Set(data.map((r) => r.periodo).filter(Boolean))).sort()

  return periodos
}

export async function fetchSalasExternas(periodo: string): Promise<string[]> {
  const data = await fetchAllPages<{ sala: string }>((from, to) =>
    supabase.from(RURAL_TABLE_NAME).select('sala').eq('periodo', periodo).range(from, to)
  )

  const salas = Array.from(new Set(data.map((r) => r.sala).filter(Boolean))).sort()

  return salas
}

export async function fetchAlocacoesExternas(periodo: string): Promise<Alocacao[]> {
  const data = await fetchAllPages<Alocacao>((from, to) =>
    supabase
      .from(RURAL_TABLE_NAME)
      .select('*')
      .eq('periodo', periodo)
      .order('dia_semana')
      .order('inicio')
      .range(from, to)
  )

  return data
}

export async function fetchAlocacoesExternasPorSala(sala: string, periodo: string): Promise<Alocacao[]> {
  const { data, error } = await supabase
    .from(RURAL_TABLE_NAME)
    .select('*')
    .eq('sala', sala)
    .eq('periodo', periodo)
    .order('dia_semana')
    .order('inicio')

  if (error) throw error
  return data as Alocacao[]
}

export async function fetchAlocacaoExternaById(id: number): Promise<Alocacao | null> {
  const { data, error } = await supabase
    .from(RURAL_TABLE_NAME)
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as Alocacao | null
}

export async function insertAlocacaoExterna(input: AlocacaoInput, periodo: string): Promise<Alocacao> {
  const { data, error } = await supabase
    .from(RURAL_TABLE_NAME)
    .insert({ ...input, periodo })
    .select()
    .single()

  if (error) throw error
  return data as Alocacao
}

export async function updateAlocacaoExterna(id: number, input: AlocacaoInput): Promise<Alocacao> {
  const { data, error } = await supabase
    .from(RURAL_TABLE_NAME)
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Alocacao
}

export async function deleteAlocacaoExterna(id: number): Promise<void> {
  const { error } = await supabase
    .from(RURAL_TABLE_NAME)
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ── Permissões por módulo (admin_roles) ──────────────────────────

export const ADMIN_ROLES_TABLE = 'admin_roles'

export async function fetchAdminRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from(ADMIN_ROLES_TABLE)
    .select('module')
    .eq('user_id', userId)

  if (error) throw error
  return (data as { module: string }[]).map((r) => r.module)
}
