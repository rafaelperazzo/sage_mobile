import { useLocalSearchParams } from 'expo-router'
import { ComModulo } from '../../../src/hooks/useAlocacoesModulo'
import { AlocacaoEditForm } from '../../../src/modules/map/AlocacaoEditForm'

// O param `sala` segue sendo enviado por quem navega para cá (grade, busca, view), mas a
// alocação é localizada pelo id na lista do período inteiro, já que a sala pode ser alterada.
export default function RuralEditScreen() {
  const { id } = useLocalSearchParams<{ id: string; sala?: string }>()
  return <ComModulo modulo="rural" render={(ctx) => <AlocacaoEditForm ctx={ctx} id={id} />} />
}
