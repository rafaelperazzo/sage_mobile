import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { router, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAlocacoesExternasPorSala, useAlocacoesExternas } from '../src/hooks/useAlocacoesExternas'
import { useSalasExternas } from '../src/hooks/useSalasExternas'
import { usePeriodoExterna } from '../src/hooks/usePeriodoExterna'
import { useModulePermission } from '../src/hooks/useModulePermission'
import { WeekGrid } from '../src/modules/map/WeekGrid'
import { BuscarSala } from '../src/modules/map/BuscarSala'
import { InfraInfoBanner } from '../src/modules/infra/InfraInfoBanner'
import { useInfraSala } from '../src/hooks/useInfraSala'
import { getCursoColor } from '../src/lib/cursoColors'
import { Ionicons } from '@expo/vector-icons'
import type { Alocacao } from '../src/types'

const ACCENT_COLOR = '#0E7490'
const ACCENT_BG = '#ECFEFF'

export default function RuralScreen() {
  const [selectedSala, setSelectedSala] = useState('')
  const [mode, setMode] = useState<'grade' | 'buscar'>('grade')
  const { hasAccess } = useModulePermission('rural')
  const { periodo, setPeriodo, periodos } = usePeriodoExterna()
  const { salas, loading: loadingSalas } = useSalasExternas(periodo)
  const { alocacoes, loading, error, reload } = useAlocacoesExternasPorSala(selectedSala, periodo)
  const { alocacoes: todasAlocacoes, loading: loadingTodas, error: errorTodas } = useAlocacoesExternas(periodo)
  const { infra, loading: loadingInfra, reload: reloadInfra } = useInfraSala(selectedSala)

  useEffect(() => {
    if (!selectedSala && salas.length > 0) setSelectedSala(salas[0]!)
  }, [salas, selectedSala])

  useFocusEffect(useCallback(() => { void reload(); void reloadInfra() }, [reload, reloadInfra]))

  function handleCellPress(alocacao: Alocacao) {
    if (hasAccess) {
      router.push({ pathname: '/rural/[id]/edit', params: { id: alocacao.id, sala: alocacao.sala } } as never)
    } else {
      router.push({ pathname: '/rural/[id]/view', params: { id: alocacao.id } } as never)
    }
  }

  function handleEmptyCellPress(dia: string, hora: string) {
    router.push({ pathname: '/rural/create', params: { sala: selectedSala, dia, hora } } as never)
  }

  const cursosNaSala = Array.from(
    new Set(alocacoes.map((a) => a.curso).filter((c): c is string => !!c))
  ).sort()

  if (loadingSalas && salas.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
        <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 13 }}>Carregando salas...</Text>
      </SafeAreaView>
    )
  }

  if (!loadingSalas && salas.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 20 }} edges={['left', 'right', 'bottom']}>
        <Text style={{ color: '#6B7280', textAlign: 'center' }}>Nenhuma sala externa encontrada.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['left', 'right', 'bottom']}>
      {/* Seletor de sala */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        {mode === 'grade' && (
          <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
            <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
              <Picker selectedValue={selectedSala} onValueChange={setSelectedSala} style={{ color: '#111827' }}>
                {salas.map((sala) => (
                  <Picker.Item key={sala} label={sala} value={sala} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Filtro de período + busca por disciplina */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 8 }}>
          {periodos.length > 1 && (
            <Picker
              selectedValue={periodo}
              onValueChange={setPeriodo}
              style={{ flex: 1, color: '#374151' }}
              dropdownIconColor="#9CA3AF"
            >
              {periodos.map((p) => (
                <Picker.Item key={p} label={p} value={p} />
              ))}
            </Picker>
          )}
          <TouchableOpacity
            onPress={() => setMode(mode === 'grade' ? 'buscar' : 'grade')}
            style={{
              marginLeft: periodos.length > 1 ? 0 : 'auto',
              padding: 8,
              borderRadius: 8,
              backgroundColor: mode === 'buscar' ? ACCENT_BG : '#F3F4F6',
            }}
          >
            <Ionicons
              name={mode === 'grade' ? 'search-outline' : 'close-outline'}
              size={18}
              color={mode === 'buscar' ? ACCENT_COLOR : '#6B7280'}
            />
          </TouchableOpacity>
        </View>

        {/* Info da sala selecionada */}
        {mode === 'grade' && (
          <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT_COLOR }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{selectedSala}</Text>
            <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
              {alocacoes.length} alocaç{alocacoes.length === 1 ? 'ão' : 'ões'}
            </Text>
            {hasAccess && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/rural/create', params: { sala: selectedSala } } as never)}
                style={{ marginLeft: 'auto', backgroundColor: ACCENT_COLOR, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>+ Nova</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Legenda de cores por curso */}
        {mode === 'grade' && cursosNaSala.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8, gap: 6 }}
            style={{ flexGrow: 0 }}
          >
            {cursosNaSala.map((curso) => {
              const cc = getCursoColor(curso)!
              return (
                <View
                  key={curso}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: cc.bg,
                    borderWidth: 1,
                    borderColor: cc.border,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cc.accent }} />
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#374151' }}>{curso}</Text>
                </View>
              )
            })}
          </ScrollView>
        )}
      </View>

      {/* Conteúdo */}
      {mode === 'buscar' ? (
        <BuscarSala alocacoes={todasAlocacoes} loading={loadingTodas} error={errorTodas} isAdmin={hasAccess} />
      ) : loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
          <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 13 }}>Carregando grade...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#DC2626', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator>
          <InfraInfoBanner
            infra={infra}
            loading={loadingInfra}
            isAdmin={false}
            accentColor={ACCENT_COLOR}
          />
          <WeekGrid
            alocacoes={alocacoes}
            isAdmin={hasAccess}
            onCellPress={handleCellPress}
            onEmptyCellPress={handleEmptyCellPress}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
