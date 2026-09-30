import { View, Text } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { Ionicons } from '@expo/vector-icons'
import { DIAS, TIME_PICKER_OPTIONS } from '../../constants/salas'

export interface HorarioValue {
  sala: string
  dia: string
  inicio: string
  fim: string
}

interface HorarioFieldsProps {
  value: HorarioValue
  onChange: (v: HorarioValue) => void
  salas: string[]
  erro?: string | null
}

const labelStyle = { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 } as const
const boxStyle = { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#F9FAFB', overflow: 'hidden' } as const

// Sala + dia + início/fim de uma alocação, com o erro de choque logo abaixo
export function HorarioFields({ value, onChange, salas, erro }: HorarioFieldsProps) {
  // Garante que a sala atual aparece no Picker mesmo se não estiver na lista do módulo
  const opcoesSala = value.sala && !salas.includes(value.sala) ? [value.sala, ...salas] : salas

  return (
    <View>
      <Text style={labelStyle}>Sala *</Text>
      <View style={[boxStyle, { marginBottom: 14 }]}>
        <Picker selectedValue={value.sala} onValueChange={(sala) => onChange({ ...value, sala })} style={{ color: '#111827' }}>
          {opcoesSala.map((s) => <Picker.Item key={s} label={s} value={s} />)}
        </Picker>
      </View>

      <Text style={labelStyle}>Dia *</Text>
      <View style={[boxStyle, { marginBottom: 14 }]}>
        <Picker selectedValue={value.dia} onValueChange={(dia) => onChange({ ...value, dia })} style={{ color: '#111827' }}>
          {DIAS.map((d) => <Picker.Item key={d} label={d} value={d} />)}
        </Picker>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>Início *</Text>
          <View style={boxStyle}>
            <Picker selectedValue={value.inicio} onValueChange={(inicio) => onChange({ ...value, inicio })} style={{ color: '#111827' }}>
              {TIME_PICKER_OPTIONS.map((h) => <Picker.Item key={h} label={h} value={h} />)}
            </Picker>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>Fim *</Text>
          <View style={boxStyle}>
            <Picker selectedValue={value.fim} onValueChange={(fim) => onChange({ ...value, fim })} style={{ color: '#111827' }}>
              {TIME_PICKER_OPTIONS.map((h) => <Picker.Item key={h} label={h} value={h} />)}
            </Picker>
          </View>
        </View>
      </View>

      {erro ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 12, gap: 8 }}>
          <Ionicons name="alert-circle" size={15} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontSize: 12, flex: 1 }}>{erro}</Text>
        </View>
      ) : null}
    </View>
  )
}
