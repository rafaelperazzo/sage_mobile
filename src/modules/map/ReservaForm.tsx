import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Picker } from '@react-native-picker/picker'
import { Ionicons } from '@expo/vector-icons'
import { TIME_PICKER_OPTIONS } from '../../constants/salas'
import { DatePickerField } from '../../components/DatePickerField'
import { MENSAGEM_CONFLITO, type ConflitoReserva } from '../../hooks/useReservasPontuais'
import { hojeYMD, diaSemanaDeData } from './gridUtils'

// Valida os campos da reserva; retorna a mensagem de erro ou null
export function validarReserva(v: { disciplina: string; data: string; dia: string; inicio: string; fim: string; conflito: ConflitoReserva }): string | null {
  if (!v.disciplina.trim()) return 'Disciplina é obrigatória.'
  if (!v.data) return 'Data é obrigatória.'
  if (v.data < hojeYMD()) return 'A data não pode ser anterior a hoje.'
  if (diaSemanaDeData(v.data) !== v.dia) return `A data deve cair numa ${v.dia}.`
  if (v.inicio >= v.fim) return 'O horário de início deve ser anterior ao fim.'
  if (v.conflito) return MENSAGEM_CONFLITO[v.conflito]
  return null
}

interface ReservaFormProps {
  sala: string
  dia: string
  accent: { color: string; disabled: string }
  disciplina: string
  setDisciplina: (v: string) => void
  professor: string
  setProfessor: (v: string) => void
  data: string
  setData: (v: string) => void
  inicio: string
  setInicio: (v: string) => void
  fim: string
  setFim: (v: string) => void
  error: string | null
  conflito: ConflitoReserva
  saving: boolean
  onSave: () => void
}

export function ReservaForm(p: ReservaFormProps) {
  const diaErrado = !!p.data && diaSemanaDeData(p.data) !== p.dia
  const blocked = p.saving || !!p.conflito || diaErrado

  return (
    <>
      {p.error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 }}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{p.error}</Text>
        </View>
      )}

      <View style={{ backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10, marginBottom: 14, gap: 4 }}>
        <Text style={{ fontSize: 11, color: '#6B7280' }}>Sala: <Text style={{ fontWeight: '700', color: '#374151' }}>{p.sala}</Text></Text>
        <Text style={{ fontSize: 11, color: '#6B7280' }}>Dia: <Text style={{ fontWeight: '700', color: '#374151' }}>{p.dia}</Text></Text>
      </View>

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Disciplina *</Text>
      <TextInput
        value={p.disciplina}
        onChangeText={p.setDisciplina}
        placeholder="Nome da disciplina"
        placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }}
      />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Professor</Text>
      <TextInput
        value={p.professor}
        onChangeText={p.setProfessor}
        placeholder="Nome completo (opcional)"
        placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }}
      />

      <DatePickerField label="Data" value={p.data} onChange={p.setData} required />

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Início *</Text>
          <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
            <Picker selectedValue={p.inicio} onValueChange={p.setInicio} style={{ color: '#111827' }}>
              {TIME_PICKER_OPTIONS.map((h) => <Picker.Item key={h} label={h} value={h} />)}
            </Picker>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Fim *</Text>
          <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
            <Picker selectedValue={p.fim} onValueChange={p.setFim} style={{ color: '#111827' }}>
              {TIME_PICKER_OPTIONS.map((h) => <Picker.Item key={h} label={h} value={h} />)}
            </Picker>
          </View>
        </View>
      </View>

      {(p.conflito || diaErrado) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 16, gap: 8 }}>
          <Ionicons name="alert-circle" size={15} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontSize: 12, flex: 1 }}>
            {diaErrado ? `A data deve cair numa ${p.dia}.` : MENSAGEM_CONFLITO[p.conflito!]}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' }}
        >
          <Text style={{ color: '#374151', fontWeight: '600' }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={p.onSave}
          disabled={blocked}
          style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: blocked ? p.accent.disabled : p.accent.color, alignItems: 'center' }}
        >
          {p.saving ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Salvar</Text>}
        </TouchableOpacity>
      </View>
    </>
  )
}
