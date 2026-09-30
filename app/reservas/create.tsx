import { useState } from 'react'
import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useReservasPontuais } from '../../src/hooks/useReservasPontuais'
import { ReservaForm, validarReserva } from '../../src/modules/map/ReservaForm'
import { ComModulo, type ModuloContexto } from '../../src/hooks/useAlocacoesModulo'
import { proximaDataDoDia } from '../../src/modules/map/gridUtils'
import type { ModuloReserva, ReservaPontualInput } from '../../src/types'

type Params = { modulo: ModuloReserva; sala: string; dia: string; inicio?: string; fim?: string }

export default function ReservaCreateScreen() {
  const params = useLocalSearchParams<Params>()
  const modulo: ModuloReserva = params.modulo === 'rural' ? 'rural' : 'map'
  return <ComModulo modulo={modulo} render={(ctx) => <ReservaCreate ctx={ctx} params={params} />} />
}

function ReservaCreate({ ctx, params }: { ctx: ModuloContexto; params: Params }) {
  const { modulo, alocacoes, accent } = ctx
  const sala = params.sala ?? ''
  const dia = params.dia ?? ''

  const { create, conflito } = useReservasPontuais(sala, modulo)

  const [disciplina, setDisciplina] = useState('')
  const [professor, setProfessor] = useState('')
  const [data, setData] = useState(() => proximaDataDoDia(dia))
  const [inicio, setInicio] = useState(params.inicio ?? '07:00')
  const [fim, setFim] = useState(params.fim ?? '08:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const input: ReservaPontualInput = {
    disciplina: disciplina.trim(),
    professor: professor.trim() || null,
    data,
    inicio,
    fim,
    sala,
    modulo,
  }
  const conflitoAtual = inicio < fim ? conflito(input, alocacoes) : null

  async function handleSave() {
    const msg = validarReserva({ disciplina, data, dia, inicio, fim, conflito: conflitoAtual })
    if (msg) { setError(msg); return }
    setSaving(true)
    setError(null)
    try {
      await create(input, alocacoes)
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
        <ReservaForm
          sala={sala}
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
      </ScrollView>
    </SafeAreaView>
  )
}
