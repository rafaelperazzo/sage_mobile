import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAlocacoes } from '../../src/hooks/useAlocacoes'
import { useAlocacoesExternas } from '../../src/hooks/useAlocacoesExternas'
import { useSalasExternas } from '../../src/hooks/useSalasExternas'
import { usePeriodoExterna } from '../../src/hooks/usePeriodoExterna'
import { usePeriodo } from '../../src/contexts/PeriodoContext'
import { SALAS } from '../../src/constants/salas'
import { predioDaSala, ordenarSalas } from '../../src/lib/predio'
import { calcularOcupacao, mediaPorGrupo } from '../../src/modules/report/occupancyUtils'
import { ReportView } from '../../src/modules/report/ReportView'

const TIPO_COLOR: Record<string, string> = {
  sala_aula: '#3B82F6',
  sala_inovacao: '#8B5CF6',
  laboratorio: '#10B981',
}

const TIPO_LABEL: Record<string, string> = {
  sala_aula: 'Sala de Aula',
  sala_inovacao: 'Sala de Inovação',
  laboratorio: 'Laboratório',
}

const RURAL_COLOR = '#0E7490'
const RURAL_BG = '#ECFEFF'
const TODOS = 'Todos'
const SEM_PREDIO = 'Outras'

type Modulo = 'map' | 'rural'

function Pilula({ label, ativo, cor, bg, onPress }: { label: string; ativo: boolean; cor: string; bg: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: ativo ? bg : '#F9FAFB',
        borderWidth: 1.5,
        borderColor: ativo ? cor : '#E5E7EB',
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: ativo ? '700' : '500', color: ativo ? cor : '#6B7280' }}>{label}</Text>
    </TouchableOpacity>
  )
}

function PeriodoPicker({ periodo, periodos, onChange }: { periodo: string; periodos: string[]; onChange: (p: string) => void }) {
  if (periodos.length <= 1) return null
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
      <Picker selectedValue={periodo} onValueChange={onChange} style={{ flex: 1, color: '#374151' }} dropdownIconColor="#9CA3AF">
        {periodos.map((p) => (
          <Picker.Item key={p} label={p} value={p} />
        ))}
      </Picker>
    </View>
  )
}

function Carregando() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Calculando ocupação...</Text>
    </View>
  )
}

// ── SAGE Map: salas fixas do DC, cor por tipo de sala ─────────────
function ReportMap() {
  const { alocacoes, loading } = useAlocacoes()
  const { periodo, setPeriodo, periodos } = usePeriodo()

  if (loading) return <Carregando />

  const summary = calcularOcupacao(alocacoes, SALAS.map((s) => ({ nome: s.nome, grupo: s.tipo })))
  const chartData = summary.salas.map((s) => ({
    label: s.sala.replace('LAB CEAGRI I - ', 'CEA-').replace('SALA ', 'S').replace('LAB ', 'L'),
    percentual: s.percentual,
    color: TIPO_COLOR[s.grupo] ?? '#6B7280',
  }))

  return (
    <>
      <PeriodoPicker periodo={periodo} periodos={periodos} onChange={setPeriodo} />
      <ReportView
        summary={summary}
        totalAlocacoes={alocacoes.length}
        chartData={chartData}
        corDaSala={(s) => TIPO_COLOR[s.grupo] ?? '#6B7280'}
        legenda={Object.entries(TIPO_COLOR).map(([tipo, color]) => ({ label: TIPO_LABEL[tipo]!, color }))}
      />
    </>
  )
}

// ── SAGE Rural: salas da tabela `externas`, filtradas por prédio ──
function ReportRural() {
  const { periodo, setPeriodo, periodos } = usePeriodoExterna()
  const { salas, loading: loadingSalas } = useSalasExternas(periodo)
  const { alocacoes, loading } = useAlocacoesExternas(periodo)
  const [predio, setPredio] = useState(TODOS)

  if (!periodo || loading || loadingSalas) return <Carregando />

  const salasRelatorio = ordenarSalas(salas)
    .map((nome) => ({ nome, grupo: predioDaSala(nome) ?? SEM_PREDIO }))
    .sort((a, b) => a.grupo.localeCompare(b.grupo, 'pt-BR', { numeric: true }))
  const predios = Array.from(new Set(salasRelatorio.map((s) => s.grupo)))
  const visiveis = predio === TODOS ? salasRelatorio : salasRelatorio.filter((s) => s.grupo === predio)
  const nomesVisiveis = new Set(visiveis.map((s) => s.nome))

  const summary = calcularOcupacao(alocacoes, visiveis)
  // "Todos": uma barra por prédio (média); prédio escolhido: uma barra por sala
  const chartData = predio === TODOS
    ? mediaPorGrupo(summary.salas).map((g) => ({ label: g.grupo, percentual: g.percentual, color: RURAL_COLOR }))
    : summary.salas.map((s) => ({
        label: s.sala.slice(s.grupo.length).replace(/^\s*-\s*/, '').replace('SALA ', 'S'),
        percentual: s.percentual,
        color: RURAL_COLOR,
      }))

  const filtroPredios = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, gap: 6 }}>
      {[TODOS, ...predios].map((p) => (
        <Pilula key={p} label={p} ativo={predio === p} cor={RURAL_COLOR} bg={RURAL_BG} onPress={() => setPredio(p)} />
      ))}
    </ScrollView>
  )

  return (
    <>
      <PeriodoPicker periodo={periodo} periodos={periodos} onChange={setPeriodo} />
      <ReportView
        key={predio}
        summary={summary}
        totalAlocacoes={alocacoes.filter((a) => nomesVisiveis.has(a.sala)).length}
        chartData={chartData}
        corDaSala={() => RURAL_COLOR}
        agruparPorGrupo={predio === TODOS}
        header={filtroPredios}
      />
    </>
  )
}

export default function ReportScreen() {
  const [modulo, setModulo] = useState<Modulo>('map')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['left', 'right', 'bottom']}>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <Pilula label="SAGE Map" ativo={modulo === 'map'} cor="#059669" bg="#ECFDF5" onPress={() => setModulo('map')} />
        <Pilula label="SAGE Rural" ativo={modulo === 'rural'} cor={RURAL_COLOR} bg={RURAL_BG} onPress={() => setModulo('rural')} />
      </View>
      {/* Cada módulo é um componente próprio: só os hooks do módulo ativo rodam */}
      {modulo === 'map' ? <ReportMap /> : <ReportRural />}
    </SafeAreaView>
  )
}
