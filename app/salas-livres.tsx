import { useCallback, useMemo, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAlocacoes } from '../src/hooks/useAlocacoes'
import { useAlocacoesExternas } from '../src/hooks/useAlocacoesExternas'
import { useSalasExternas } from '../src/hooks/useSalasExternas'
import { usePeriodo } from '../src/contexts/PeriodoContext'
import { usePeriodoExterna } from '../src/hooks/usePeriodoExterna'
import { SALAS, getSalaInfo, TIPO_LABEL } from '../src/constants/salas'
import type { Alocacao } from '../src/types'

// Mapeia Date.getDay() (0=domingo) para o rótulo de dia usado em dia_semana
const DIA_POR_GETDAY: Record<number, string | undefined> = {
  0: undefined,
  1: 'SEGUNDA',
  2: 'TERÇA',
  3: 'QUARTA',
  4: 'QUINTA',
  5: 'SEXTA',
  6: 'SÁBADO',
}

const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda-feira',
  TERÇA: 'Terça-feira',
  QUARTA: 'Quarta-feira',
  QUINTA: 'Quinta-feira',
  SEXTA: 'Sexta-feira',
  SÁBADO: 'Sábado',
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

interface SalaLivre {
  sala: string
  livreAteMin: number | null // null = sem mais aulas hoje
}

function calcularSalasLivres(
  salas: string[],
  alocacoes: Alocacao[],
  diaHoje: string | undefined,
  nowMin: number
): SalaLivre[] {
  const livres: SalaLivre[] = []

  for (const sala of salas) {
    const doDia = diaHoje ? alocacoes.filter((a) => a.sala === sala && a.dia_semana === diaHoje) : []
    const ocupadaAgora = doDia.some((a) => timeToMinutes(a.inicio) <= nowMin && timeToMinutes(a.fim) > nowMin)
    if (ocupadaAgora) continue

    const proximaAula = doDia
      .map((a) => timeToMinutes(a.inicio))
      .filter((inicio) => inicio > nowMin)
      .sort((a, b) => a - b)[0]

    livres.push({ sala, livreAteMin: proximaAula ?? null })
  }

  return livres.sort((a, b) => a.sala.localeCompare(b.sala, 'pt-BR'))
}

function SalaLivreRow({ item, tipoLabel }: { item: SalaLivre; tipoLabel?: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{item.sala}</Text>
        {tipoLabel && <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{tipoLabel}</Text>}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F0FDF4',
          borderWidth: 1,
          borderColor: '#BBF7D0',
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 4,
          gap: 4,
        }}
      >
        <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#15803D' }}>
          {item.livreAteMin !== null ? `Livre até ${minutesToTime(item.livreAteMin)}` : 'Livre o resto do dia'}
        </Text>
      </View>
    </View>
  )
}

function SectionHeader({ title, count, accent }: { title: string; count: number; accent: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '700', color: accent, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{count} livre{count === 1 ? '' : 's'}</Text>
    </View>
  )
}

function SectionBody({
  loading,
  error,
  salas,
  tipoBadge,
}: {
  loading: boolean
  error: string | null
  salas: SalaLivre[]
  tipoBadge?: (sala: string) => string | undefined
}) {
  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#1D4ED8" />
      </View>
    )
  }
  if (error) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: '#DC2626', fontSize: 12, textAlign: 'center' }}>{error}</Text>
      </View>
    )
  }
  if (salas.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Nenhuma sala livre agora.</Text>
      </View>
    )
  }
  return (
    <>
      {salas.map((item) => (
        <SalaLivreRow key={item.sala} item={item} tipoLabel={tipoBadge?.(item.sala)} />
      ))}
    </>
  )
}

export default function SalasLivresScreen() {
  const { periodo } = usePeriodo()
  const { alocacoes: alocacoesMap, loading: loadingMap, error: errorMap, reload: reloadMap } = useAlocacoes()

  const { periodo: periodoRural } = usePeriodoExterna()
  const { salas: salasRural, loading: loadingSalasRural, reload: reloadSalasRural } = useSalasExternas(periodoRural)
  const {
    alocacoes: alocacoesRural,
    loading: loadingRural,
    error: errorRural,
    reload: reloadRural,
  } = useAlocacoesExternas(periodoRural)

  const [now, setNow] = useState(() => new Date())

  const refresh = useCallback(() => {
    setNow(new Date())
    void reloadMap()
    void reloadSalasRural()
    void reloadRural()
  }, [reloadMap, reloadSalasRural, reloadRural])

  useFocusEffect(useCallback(() => { refresh() }, [refresh]))

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const diaHoje = DIA_POR_GETDAY[now.getDay()]

  const salasLivresMap = useMemo(
    () => calcularSalasLivres(SALAS.map((s) => s.nome), alocacoesMap, diaHoje, nowMin),
    [alocacoesMap, diaHoje, nowMin]
  )
  const salasLivresRural = useMemo(
    () => calcularSalasLivres(salasRural, alocacoesRural, diaHoje, nowMin),
    [salasRural, alocacoesRural, diaHoje, nowMin]
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['left', 'right', 'bottom']}>
      <View
        style={{
          padding: 14,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>
            {diaHoje ? DIA_LABEL[diaHoje] : 'Domingo'} · {minutesToTime(nowMin)}
          </Text>
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Salas livres neste exato momento</Text>
        </View>
        <TouchableOpacity
          onPress={refresh}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: '#EFF6FF',
            borderRadius: 8,
          }}
        >
          <Ionicons name="refresh-outline" size={14} color="#1D4ED8" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#1D4ED8' }}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <SectionHeader title={`SAGE Map${periodo ? ` · ${periodo}` : ''}`} count={salasLivresMap.length} accent="#1D4ED8" />
        <SectionBody
          loading={loadingMap}
          error={errorMap}
          salas={salasLivresMap}
          tipoBadge={(sala) => TIPO_LABEL[getSalaInfo(sala)?.tipo ?? 'sala_aula']}
        />

        <SectionHeader
          title={`SAGE Rural${periodoRural ? ` · ${periodoRural}` : ''}`}
          count={salasLivresRural.length}
          accent="#0E7490"
        />
        <SectionBody loading={loadingRural || loadingSalasRural} error={errorRural} salas={salasLivresRural} />
      </ScrollView>
    </SafeAreaView>
  )
}
