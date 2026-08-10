import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { fetchAlocacaoExternaById } from '../../../src/lib/supabase'
import { getCursoColor } from '../../../src/lib/cursoColors'
import { Ionicons } from '@expo/vector-icons'
import { useModulePermission } from '../../../src/hooks/useModulePermission'
import type { Alocacao } from '../../../src/types'

const ACCENT_COLOR = '#0E7490'

export default function RuralViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { hasAccess } = useModulePermission('rural')
  const [alocacao, setAlocacao] = useState<Alocacao | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchAlocacaoExternaById(Number(id))
      .then(setAlocacao)
      .finally(() => setLoading(false))
  }, [id])

  const cursoColor = alocacao ? getCursoColor(alocacao.curso) : null
  const color = cursoColor?.accent ?? ACCENT_COLOR

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
      </View>
    )
  }

  if (!alocacao) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Alocação não encontrada.</Text>
      </View>
    )
  }

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 15, color: '#111827', fontWeight: '500' }}>{value}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ width: 4, height: 40, backgroundColor: color, borderRadius: 2, marginRight: 12 }} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', flex: 1 }}>
          {alocacao.disciplina}
        </Text>
      </View>

      <Row label="Sala" value={alocacao.sala} />
      {alocacao.curso && <Row label="Curso" value={alocacao.curso} />}
      {alocacao.semestre != null && <Row label="Semestre" value={`${alocacao.semestre}º`} />}
      <Row label="Dia da Semana" value={alocacao.dia_semana} />
      <Row label="Horário" value={`${alocacao.inicio} – ${alocacao.fim}`} />
      {alocacao.professor && <Row label="Professor" value={alocacao.professor} />}
      <Row label="Período" value={alocacao.periodo} />

      {hasAccess && (
        <TouchableOpacity
          onPress={() => {
            router.replace({ pathname: '/rural/[id]/edit', params: { id: alocacao.id, sala: alocacao.sala } } as never)
          }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFEFF', borderWidth: 1, borderColor: '#A5F3FC', borderRadius: 12, padding: 14, marginTop: 16, gap: 8 }}
        >
          <Ionicons name="pencil" size={16} color="#0E7490" />
          <Text style={{ color: '#0E7490', fontWeight: '700' }}>Editar Alocação</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginTop: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#6B7280', fontWeight: '600' }}>Fechar</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}
