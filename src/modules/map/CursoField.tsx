import { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { Picker } from '@react-native-picker/picker'

const OUTRO = '__outro__'

interface CursoFieldProps {
  value: string
  onChange: (v: string) => void
  cursos: string[]   // cursos já existentes no período do módulo
}

// Curso da turma: escolhe entre os cursos já cadastrados (evita grafias diferentes) ou digita um novo
export function CursoField({ value, onChange, cursos }: CursoFieldProps) {
  const [digitando, setDigitando] = useState(() => value !== '' && !cursos.includes(value))
  // Mantém no Picker um curso atual que não esteja na lista (ex.: dados antigos)
  const opcoes = value && !digitando && !cursos.includes(value) ? [value, ...cursos] : cursos

  function handlePicker(v: string) {
    if (v === OUTRO) {
      setDigitando(true)
      onChange('')
      return
    }
    setDigitando(false)
    onChange(v)
  }

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Curso *</Text>
      <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
        <Picker selectedValue={digitando ? OUTRO : value} onValueChange={handlePicker} style={{ color: '#111827' }}>
          <Picker.Item label="Selecione o curso" value="" color="#9CA3AF" />
          {opcoes.map((c) => <Picker.Item key={c} label={c} value={c} />)}
          <Picker.Item label="Outro…" value={OUTRO} />
        </Picker>
      </View>
      {digitando && (
        <TextInput
          value={value}
          onChangeText={onChange}
          autoCapitalize="characters"
          placeholder="Sigla do curso (ex.: BCC)"
          placeholderTextColor="#9CA3AF"
          style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginTop: 8, backgroundColor: '#F9FAFB' }}
        />
      )}
    </View>
  )
}
