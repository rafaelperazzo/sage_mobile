import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CURSOS, type Curso } from '../src/constants/cursos'
import { fetchPeriodos } from '../src/lib/supabase'
import { useAlocacoesPorPeriodo } from '../src/hooks/useAlocacoes'
import { CurricularGrid } from '../src/modules/gradeCurricular/CurricularGrid'
import type { Alocacao } from '../src/types'

const PERIODO_MINIMO = { ano: 2026, semestre: 2 }

function parsePeriodo(periodo: string): { ano: number; semestre: number } {
  const [anoStr, semStr] = periodo.split('.')
  return { ano: Number(anoStr), semestre: Number(semStr) }
}

function isPeriodoValido(periodo: string): boolean {
  const { ano, semestre } = parsePeriodo(periodo)
  if (ano > PERIODO_MINIMO.ano) return true
  return ano === PERIODO_MINIMO.ano && semestre >= PERIODO_MINIMO.semestre
}

export default function GradeCurricularScreen() {
  const [curso, setCurso] = useState<Curso>('BCC')
  const [periodos, setPeriodos] = useState<string[]>([])
  const [periodo, setPeriodo] = useState<string>('')
  const [semestre, setSemestre] = useState<number | null>(null)
  const [loadingPeriodos, setLoadingPeriodos] = useState(true)

  useEffect(() => {
    fetchPeriodos()
      .then((lista) => {
        const validos = lista.filter(isPeriodoValido).sort()
        setPeriodos(validos)
        if (validos.length > 0) setPeriodo(validos[0]!)
      })
      .catch(console.error)
      .finally(() => setLoadingPeriodos(false))
  }, [])

  const { alocacoes, loading, error } = useAlocacoesPorPeriodo(periodo)

  const semestresDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        alocacoes
          .filter((a) => a.curso === curso)
          .map((a) => a.semestre)
          .filter((s): s is number => s != null)
      )
    ).sort((a, b) => a - b)
  }, [alocacoes, curso])

  useEffect(() => {
    if (semestresDisponiveis.length === 0) {
      setSemestre(null)
    } else if (semestre == null || !semestresDisponiveis.includes(semestre)) {
      setSemestre(semestresDisponiveis[0]!)
    }
  }, [semestresDisponiveis, semestre])

  const alocacoesFiltradas = useMemo(() => {
    return alocacoes.filter((a) => a.curso === curso && a.semestre === semestre)
  }, [alocacoes, curso, semestre])

  function handleCellPress(alocacao: Alocacao) {
    router.push({ pathname: '/map/[id]/view', params: { id: alocacao.id } } as never)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['left', 'right', 'bottom']}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        {/* Seletor de curso */}
        <View style={{ flexDirection: 'row', padding: 8, gap: 6 }}>
          {CURSOS.map((c) => {
            const isSelected = c === curso
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCurso(c)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isSelected ? '#EFF6FF' : '#F9FAFB',
                  borderWidth: 1.5,
                  borderColor: isSelected ? '#2563EB' : '#E5E7EB',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#2563EB' : '#6B7280',
                  }}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Seletores de período e semestre */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8, gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Picker
              enabled={periodos.length > 0}
              selectedValue={periodo}
              onValueChange={setPeriodo}
              style={{ color: '#374151' }}
              dropdownIconColor="#9CA3AF"
            >
              {periodos.map((p) => (
                <Picker.Item key={p} label={p} value={p} />
              ))}
            </Picker>
          </View>
          <View style={{ flex: 1 }}>
            <Picker
              enabled={semestresDisponiveis.length > 0}
              selectedValue={semestre}
              onValueChange={setSemestre}
              style={{ color: '#374151' }}
              dropdownIconColor="#9CA3AF"
            >
              {semestresDisponiveis.map((s) => (
                <Picker.Item key={s} label={`${s}º semestre`} value={s} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {loadingPeriodos || loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 13 }}>Carregando grade...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#DC2626', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : periodos.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>
            Nenhum período letivo disponível a partir de 2026.2.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator>
          <CurricularGrid alocacoes={alocacoesFiltradas} onCellPress={handleCellPress} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
