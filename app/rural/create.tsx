import { useLocalSearchParams } from 'expo-router'
import { ComModulo } from '../../src/hooks/useAlocacoesModulo'
import { AlocacaoCreateForm } from '../../src/modules/map/AlocacaoCreateForm'

export default function RuralCreateScreen() {
  const params = useLocalSearchParams<{ sala?: string; dia?: string; hora?: string }>()
  return (
    <ComModulo
      modulo="rural"
      render={(ctx) => <AlocacaoCreateForm ctx={ctx} sala={params.sala} dia={params.dia} hora={params.hora} />}
    />
  )
}
