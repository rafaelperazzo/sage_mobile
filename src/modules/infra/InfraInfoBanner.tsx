import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { InfraSala } from '../../types'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

interface InfraInfoBannerProps {
  infra: InfraSala | null
  loading: boolean
  isAdmin: boolean
  onPress?: () => void
  accentColor?: string
  bgColor?: string
  borderColor?: string
}

function buildResumo(infra: InfraSala): string {
  const partes: string[] = []
  partes.push(`${infra.cadeiras ?? 0} cadeira${infra.cadeiras === 1 ? '' : 's'}`)
  partes.push(infra.projetor ? 'com projetor' : 'sem projetor')
  partes.push(infra.tv ? 'com televisão' : 'sem televisão')
  partes.push(infra.hdmi ? 'com cabo HDMI' : 'sem cabo HDMI')
  partes.push(`${infra.arcondicionado} ar-condicionado${infra.arcondicionado === 1 ? '' : 's'}`)
  if (infra.computadores) partes.push(`${infra.computadores} computador${infra.computadores === 1 ? '' : 'es'}`)
  return `Esta sala possui ${partes.join(', ')}.`
}

function Badge({ icon, label, ok }: { icon: IoniconsName; label: string; ok: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: ok ? '#FFFFFF' : '#F3F4F6',
        borderWidth: 1,
        borderColor: ok ? '#E5E7EB' : '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        opacity: ok ? 1 : 0.55,
      }}
    >
      <Ionicons name={icon} size={13} color={ok ? '#374151' : '#9CA3AF'} />
      <Text style={{ fontSize: 11, fontWeight: '600', color: ok ? '#374151' : '#9CA3AF' }}>{label}</Text>
    </View>
  )
}

export function InfraInfoBanner({
  infra,
  loading,
  isAdmin,
  onPress,
  accentColor = '#2563EB',
  bgColor = '#F9FAFB',
  borderColor = '#E5E7EB',
}: InfraInfoBannerProps) {
  if (loading) {
    return (
      <View style={{ margin: 12, marginBottom: 0, padding: 12, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={accentColor} />
      </View>
    )
  }

  if (!infra) {
    return null
  }

  const clickable = isAdmin && !!onPress

  return (
    <TouchableOpacity
      onPress={clickable ? onPress : undefined}
      disabled={!clickable}
      activeOpacity={clickable ? 0.7 : 1}
      style={{
        marginHorizontal: 12,
        marginBottom: 8,
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Ionicons name="information-circle-outline" size={15} color={accentColor} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: accentColor, flex: 1 }}>
          Infraestrutura da sala
        </Text>
        {isAdmin && <Ionicons name="pencil-outline" size={13} color={accentColor} />}
      </View>

      <Text style={{ fontSize: 12, color: '#374151', lineHeight: 17, marginBottom: 8 }}>
        {buildResumo(infra)}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Badge icon="people-outline" label={`${infra.cadeiras ?? 0} cadeiras`} ok />
        <Badge icon="videocam-outline" label="Projetor" ok={!!infra.projetor} />
        <Badge icon="tv-outline" label="TV" ok={!!infra.tv} />
        <Badge icon="git-network-outline" label="HDMI" ok={!!infra.hdmi} />
        <Badge icon="snow-outline" label={`Ar-cond. (${infra.arcondicionado})`} ok={infra.arcondicionado > 0} />
        {!!infra.computadores && (
          <Badge icon="desktop-outline" label={`${infra.computadores} PCs`} ok />
        )}
      </View>
    </TouchableOpacity>
  )
}
