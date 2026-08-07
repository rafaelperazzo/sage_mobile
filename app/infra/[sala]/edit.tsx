import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useInfraSala } from '../../../src/hooks/useInfraSala'
import { useAuthContext } from '../../../src/contexts/AuthContext'
import type { InfraSalaInput } from '../../../src/types'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

function ToggleField({ label, icon, value, onChange }: { label: string; icon: IoniconsName; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Ionicons name={icon} size={14} color="#374151" />
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#D1D5DB' }}>
        {[{ v: true, l: 'Sim' }, { v: false, l: 'Não' }].map((opt) => (
          <TouchableOpacity
            key={opt.l}
            onPress={() => onChange(opt.v)}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              backgroundColor: value === opt.v ? '#2563EB' : '#F9FAFB',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: value === opt.v ? '#FFFFFF' : '#6B7280' }}>
              {opt.l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

function NumberField({ label, icon, value, onChange }: { label: string; icon: IoniconsName; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Ionicons name={icon} size={14} color="#374151" />
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' }}
      />
    </View>
  )
}

export default function InfraEditScreen() {
  const { sala } = useLocalSearchParams<{ sala: string }>()
  const { isAdmin } = useAuthContext()
  const { infra, loading, update } = useInfraSala(sala ?? '')

  const [cadeiras, setCadeiras] = useState('')
  const [projetor, setProjetor] = useState(false)
  const [tv, setTv] = useState(false)
  const [hdmi, setHdmi] = useState(false)
  const [arcondicionado, setArcondicionado] = useState('')
  const [computadores, setComputadores] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) router.back()
  }, [isAdmin])

  useEffect(() => {
    if (infra) {
      setCadeiras(String(infra.cadeiras ?? 0))
      setProjetor(!!infra.projetor)
      setTv(!!infra.tv)
      setHdmi(!!infra.hdmi)
      setArcondicionado(String(infra.arcondicionado ?? 0))
      setComputadores(String(infra.computadores ?? 0))
    }
  }, [infra?.id])

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  if (!infra) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: '#6B7280', textAlign: 'center' }}>
          Infraestrutura não cadastrada para a sala "{sala}".
        </Text>
      </View>
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const input: InfraSalaInput = {
      sala: infra!.sala,
      cadeiras: Number(cadeiras) || 0,
      projetor: projetor ? 1 : 0,
      tv: tv ? 1 : 0,
      hdmi: hdmi ? 1 : 0,
      arcondicionado: Number(arcondicionado) || 0,
      computadores: Number(computadores) || 0,
    }
    try {
      await update(input)
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10, marginBottom: 18 }}>
          <Text style={{ fontSize: 11, color: '#6B7280' }}>Sala</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{infra.sala}</Text>
        </View>

        {error && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 }}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</Text>
          </View>
        )}

        <NumberField label="Cadeiras" icon="people-outline" value={cadeiras} onChange={setCadeiras} />
        <ToggleField label="Projetor" icon="videocam-outline" value={projetor} onChange={setProjetor} />
        <ToggleField label="Televisão" icon="tv-outline" value={tv} onChange={setTv} />
        <ToggleField label="Cabo HDMI" icon="git-network-outline" value={hdmi} onChange={setHdmi} />
        <NumberField label="Unidades de ar-condicionado" icon="snow-outline" value={arcondicionado} onChange={setArcondicionado} />
        <NumberField label="Computadores" icon="desktop-outline" value={computadores} onChange={setComputadores} />

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ marginTop: 8, padding: 14, borderRadius: 12, backgroundColor: saving ? '#93C5FD' : '#2563EB', alignItems: 'center' }}
        >
          {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Salvar</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' }}
        >
          <Text style={{ color: '#374151', fontWeight: '600' }}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
