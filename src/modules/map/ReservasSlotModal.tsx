import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ReservaPontual } from '../../types'

function formatData(ymd: string): string {
  const [y, m, d] = ymd.split('-')
  return `${d}/${m}/${y}`
}

interface ReservasSlotModalProps {
  dia: string
  inicio: string
  fim: string
  reservas: ReservaPontual[]
  canEdit: boolean
  accentColor: string
  onClose: () => void
  onNovaReserva: () => void
  onNovaAlocacao: () => void
  onEditReserva: (reserva: ReservaPontual) => void
}

// Lista as reservas pontuais futuras de um slot livre (VER RESERVAS na WeekGrid)
export function ReservasSlotModal({
  dia,
  inicio,
  fim,
  reservas,
  canEdit,
  accentColor,
  onClose,
  onNovaReserva,
  onNovaAlocacao,
  onEditReserva,
}: ReservasSlotModalProps) {
  const ordenadas = [...reservas].sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio))

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={onClose}>
        <Pressable style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 380, maxHeight: '80%', overflow: 'hidden' }} onPress={() => {}}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Reservas</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{dia} · {inicio}–{fim}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Lista */}
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {ordenadas.length === 0 ? (
              <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>Nenhuma reserva futura.</Text>
            ) : (
              ordenadas.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  disabled={!canEdit}
                  activeOpacity={0.6}
                  onPress={() => onEditReserva(r)}
                  style={{ borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#B45309' }}>
                      {formatData(r.data)} · {r.inicio}–{r.fim}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#111827', marginTop: 2 }}>{r.disciplina}</Text>
                    {r.professor ? (
                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{r.professor}</Text>
                    ) : null}
                  </View>
                  {canEdit && <Ionicons name="create-outline" size={18} color="#B45309" />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Ações do admin */}
          {canEdit && (
            <View style={{ flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <TouchableOpacity
                onPress={onNovaAlocacao}
                style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: accentColor, alignItems: 'center' }}
              >
                <Text style={{ color: accentColor, fontWeight: '700', fontSize: 13 }}>Nova alocação</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onNovaReserva}
                style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: accentColor, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Nova reserva</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}
