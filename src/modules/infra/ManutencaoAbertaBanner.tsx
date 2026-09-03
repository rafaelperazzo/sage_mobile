import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Manutencao } from '../../types'

interface ManutencaoAbertaBannerProps {
  manutencoes: Manutencao[]
  loading: boolean
}

export function ManutencaoAbertaBanner({ manutencoes, loading }: ManutencaoAbertaBannerProps) {
  if (loading || manutencoes.length === 0) {
    return null
  }

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginBottom: 8,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        padding: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Ionicons name="warning-outline" size={15} color="#DC2626" />
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626', flex: 1 }}>
          {manutencoes.length === 1
            ? 'Chamado de manutenção em aberto'
            : `${manutencoes.length} chamados de manutenção em aberto`}
        </Text>
      </View>

      {manutencoes.map((m) => (
        <View key={m.id} style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: '#991B1B' }}>•</Text>
          <Text style={{ fontSize: 12, color: '#991B1B', lineHeight: 17, flex: 1 }}>
            {m.descricao_problema}
          </Text>
        </View>
      ))}
    </View>
  )
}
