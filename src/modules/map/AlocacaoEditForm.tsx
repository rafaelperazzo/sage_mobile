import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Checkbox } from '../../components/Checkbox'
import type { ModuloContexto } from '../../hooks/useAlocacoesModulo'
import type { AlocacaoInput } from '../../types'
import { HorarioFields, type HorarioValue } from './HorarioFields'
import { CursoField } from './CursoField'
import { conflitosDoLote, ocorrenciasDaDisciplina, descreverAlocacao } from './alocacaoLote'

interface AlocacaoEditFormProps {
  ctx: ModuloContexto
  id: string
}

// Edição de uma alocação, com opção de refletir disciplina/professor/sala nas demais ocorrências da disciplina
export function AlocacaoEditForm({ ctx, id }: AlocacaoEditFormProps) {
  const { periodo, alocacoes, reservas, salas, cursos, accent, loading } = ctx
  const alocacao = alocacoes.find((a) => String(a.id) === id)

  const [disciplina, setDisciplina] = useState(alocacao?.disciplina ?? '')
  const [professor, setProfessor] = useState(alocacao?.professor ?? '')
  const [curso, setCurso] = useState(alocacao?.curso?.trim() ?? '')
  const [horario, setHorario] = useState<HorarioValue>({
    sala: alocacao?.sala ?? '',
    dia: alocacao?.dia_semana ?? '',
    inicio: alocacao?.inicio ?? '07:00',
    fim: alocacao?.fim ?? '09:00',
  })
  const [refletir, setRefletir] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (alocacao) {
      setDisciplina(alocacao.disciplina)
      setProfessor(alocacao.professor ?? '')
      setCurso(alocacao.curso?.trim() ?? '')
      setHorario({ sala: alocacao.sala, dia: alocacao.dia_semana, inicio: alocacao.inicio, fim: alocacao.fim })
    }
  }, [alocacao?.id])

  if (!alocacao) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {loading ? <ActivityIndicator color={accent.color} /> : <Text style={{ color: '#6B7280' }}>Alocação não encontrada.</Text>}
      </View>
    )
  }

  // alocacao is guaranteed non-null after the early return above
  const safeAlocacao = alocacao
  // Demais ocorrências da turma (mesmo nome + professor + curso), pelos valores originais
  const outras = ocorrenciasDaDisciplina(alocacoes, safeAlocacao)

  const principal: AlocacaoInput = {
    disciplina: disciplina.trim(),
    professor: professor.trim() || null,
    curso: curso.trim() || null,
    dia_semana: horario.dia,
    sala: horario.sala,
    inicio: horario.inicio,
    fim: horario.fim,
  }
  // Com reflexo: disciplina, professor, curso e sala vão para todas; dia e horário de cada uma se mantêm
  const candidatas: { id: number; input: AlocacaoInput }[] = [
    { id: safeAlocacao.id, input: principal },
    ...(refletir
      ? outras.map((o) => ({
          id: o.id,
          input: { ...principal, dia_semana: o.dia_semana, inicio: o.inicio, fim: o.fim },
        }))
      : []),
  ]
  const erros = conflitosDoLote(
    candidatas.map((c) => c.input),
    alocacoes,
    reservas,
    candidatas.map((c) => c.id)
  )
  const [erroPrincipal, ...errosOutras] = erros
  const temErro = erros.some((e) => e !== null)
  const blocked = saving || temErro

  async function handleSave() {
    if (!disciplina.trim()) { setError('Disciplina é obrigatória.'); return }
    if (!curso.trim()) { setError('Curso é obrigatório.'); return }
    if (temErro) { setError('Corrija os choques de horário antes de salvar.'); return }
    setSaving(true)
    setError(null)
    try {
      await ctx.updateMany(candidatas)
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
      void ctx.reload()
    } finally {
      setSaving(false)
    }
  }

  async function remover(ids: number[]) {
    try {
      await ctx.removeMany(ids)
      router.back()
    } catch {
      setError('Erro ao remover alocação.')
    }
  }

  function handleDelete() {
    if (outras.length === 0) {
      Alert.alert('Remover Alocação', `Deseja remover "${safeAlocacao.disciplina}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => void remover([safeAlocacao.id]) },
      ])
      return
    }
    Alert.alert(
      'Remover Alocação',
      `"${safeAlocacao.disciplina}" tem ${outras.length + 1} alocações. Remover só esta ou todas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Só esta', onPress: () => void remover([safeAlocacao.id]) },
        {
          text: `Todas (${outras.length + 1})`,
          style: 'destructive',
          onPress: () => void remover([safeAlocacao.id, ...outras.map((o) => o.id)]),
        },
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 }}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</Text>
        </View>
      )}

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Disciplina *</Text>
      <TextInput
        value={disciplina}
        onChangeText={setDisciplina}
        placeholder="Nome da disciplina"
        placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }}
      />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Professor</Text>
      <TextInput
        value={professor}
        onChangeText={setProfessor}
        placeholder="Nome completo (opcional)"
        placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }}
      />

      <CursoField value={curso} onChange={setCurso} cursos={cursos} />

      <View style={{ backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10, marginBottom: 14, gap: 4 }}>
        <Text style={{ fontSize: 11, color: '#6B7280' }}>Período: <Text style={{ fontWeight: '700', color: '#374151' }}>{periodo}</Text></Text>
        {alocacao.semestre != null && (
          <Text style={{ fontSize: 11, color: '#6B7280' }}>Semestre: <Text style={{ fontWeight: '700', color: '#374151' }}>{alocacao.semestre}º</Text></Text>
        )}
      </View>

      <HorarioFields value={horario} onChange={setHorario} salas={salas} erro={erroPrincipal} />

      {outras.length > 0 && (
        <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
            Esta turma ({alocacao.curso ?? 'sem curso'}) tem mais {outras.length} alocaç{outras.length === 1 ? 'ão' : 'ões'}:
          </Text>
          {outras.map((o, i) => (
            <View key={o.id} style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>• {descreverAlocacao(refletir ? { ...o, sala: horario.sala } : o)}</Text>
              {refletir && errosOutras[i] ? (
                <Text style={{ fontSize: 11, color: '#DC2626', marginLeft: 10 }}>{errosOutras[i]}</Text>
              ) : null}
            </View>
          ))}
          <Checkbox
            checked={refletir}
            label="Refletir em todos os dias e horários da disciplina"
            hint="Disciplina, professor, curso e sala serão aplicados a todas; dia e horário só a esta."
            color={accent.color}
            onPress={() => setRefletir(!refletir)}
          />
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
          onPress={handleSave}
          disabled={blocked}
          style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: blocked ? accent.disabled : accent.color, alignItems: 'center' }}
        >
          {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Salvar</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleDelete}
        style={{ padding: 14, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
      >
        <Ionicons name="trash-outline" size={16} color="#DC2626" />
        <Text style={{ color: '#DC2626', fontWeight: '700' }}>Remover Alocação</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}
