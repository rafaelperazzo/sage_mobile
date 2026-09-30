import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useReservasPontuais } from '../../../src/hooks/useReservasPontuais'
import { ReservaForm, validarReserva } from '../../../src/modules/map/ReservaForm'
import { ComModulo, type ModuloContexto } from '../../../src/hooks/useAlocacoesModulo'
import { diaSemanaDeData } from '../../../src/modules/map/gridUtils'
import type { ModuloReserva, ReservaPontualInput } from '../../../src/types'

type Params = { id: string; modulo: ModuloReserva; sala: string }

export default function ReservaEditScreen() {
  const params = useLocalSearchParams<Params>()
  const modulo: ModuloReserva = params.modulo === 'rural' ? 'rural' : 'map'
  return <ComModulo modulo={modulo} render={(ctx) => <ReservaEdit ctx={ctx} params={params} />} />
}

function ReservaEdit({ ctx, params }: { ctx: ModuloContexto; params: Params }) {
  const { modulo, alocacoes, accent } = ctx
  const sala = params.sala ?? ''

  const { reservas, loading, update, remove, conflito } = useReservasPontuais(sala, modulo)
  const reserva = reservas.find((r) => String(r.id) === params.id)

  const [disciplina, setDisciplina] = useState(reserva?.disciplina ?? '')
  const [professor, setProfessor] = useState(reserva?.professor ?? '')
  const [data, setData] = useState(reserva?.data ?? '')
  const [inicio, setInicio] = useState(reserva?.inicio ?? '07:00')
  const [fim, setFim] = useState(reserva?.fim ?? '08:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (reserva) {
      setDisciplina(reserva.disciplina)
      setProfessor(reserva.professor ?? '')
      setData(reserva.data)
      setInicio(reserva.inicio)
      setFim(reserva.fim)
    }
  }, [reserva?.id])

  if (!reserva) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {loading ? <ActivityIndicator color={accent.color} /> : <Text style={{ color: '#6B7280' }}>Reserva não encontrada.</Text>}
      </View>
    )
  }

  // reserva is guaranteed non-null after the early return above
  const safeReserva = reserva
  // A data fica presa ao dia da semana original da reserva
  const dia = diaSemanaDeData(safeReserva.data) ?? ''

  const input: ReservaPontualInput = {
    disciplina: disciplina.trim(),
    professor: professor.trim() || null,
    data,
    inicio,
    fim,
    sala: safeReserva.sala,
    modulo,
  }
  const conflitoAtual = inicio < fim ? conflito(input, alocacoes, safeReserva.id) : null

  async function handleSave() {
    const msg = validarReserva({ disciplina, data, dia, inicio, fim, conflito: conflitoAtual })
    if (msg) { setError(msg); return }
    setSaving(true)
    setError(null)
    try {
      await update(safeReserva.id, input, alocacoes)
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete() {
    Alert.alert(
      'Remover Reserva',
      `Deseja remover a reserva de "${safeReserva.disciplina}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(safeReserva.id)
              router.back()
            } catch {
              setError('Erro ao remover reserva.')
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <ReservaForm
          sala={safeReserva.sala}
          dia={dia}
          accent={accent}
          disciplina={disciplina}
          setDisciplina={setDisciplina}
          professor={professor}
          setProfessor={setProfessor}
          data={data}
          setData={setData}
          inicio={inicio}
          setInicio={setInicio}
          fim={fim}
          setFim={setFim}
          error={error}
          conflito={conflitoAtual}
          saving={saving}
          onSave={handleSave}
        />

        <TouchableOpacity
          onPress={handleDelete}
          style={{ padding: 14, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontWeight: '700' }}>Remover Reserva</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
