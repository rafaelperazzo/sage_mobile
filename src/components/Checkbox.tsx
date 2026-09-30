import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface CheckboxProps {
  checked: boolean
  label: string
  hint?: string
  color: string
  onPress: () => void
}

export function Checkbox({ checked, label, hint, color, onPress }: CheckboxProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 6 }}>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color={checked ? color : '#9CA3AF'} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{label}</Text>
        {hint ? <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{hint}</Text> : null}
      </View>
    </TouchableOpacity>
  )
}
