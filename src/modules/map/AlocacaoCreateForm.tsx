import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { DIAS } from '../../constants/salas'
import { Checkbox } from '../../components/Checkbox'
import type { ModuloContexto } from '../../hooks/useAlocacoesModulo'
import type { AlocacaoInput } from '../../types'
import { HorarioFields, type HorarioValue } from './HorarioFields'
import { CursoField } from './CursoField'
import { conflitosDoLote } from './alocacaoLote'
import { timeToMinutes, minutesToTime } from './gridUtils'

const MAX_ALOCACOES = 3
const DIAS_UTEIS = DIAS.filter((d) => d !== 'SÁBADO')

interface AlocacaoCreateFormProps {
  ctx: ModuloContexto
  sala?: string
  dia?: string
  hora?: string
}

// Criação de 1 a 3 alocações da mesma disciplina/professor em dias, horários e salas diferentes
export function AlocacaoCreateForm({ ctx, sala: salaParam, dia: diaParam, hora }: AlocacaoCreateFormProps) {
  const { periodo, alocacoes, reservas, salas, cursos, accent, loading } = ctx

  const [disciplina, setDisciplina] = useState('')
  const [professor, setProfessor] = useState('')
  const [curso, setCurso] = useState('')
  const [blocos, setBlocos] = useState<HorarioValue[]>(() => {
    const inicio = hora ?? '07:00'
    return [{
      sala: salaParam ?? salas[0] ?? '',
      dia: diaParam ?? DIAS[0]!,
      inicio,
      fim: minutesToTime(timeToMinutes(inicio) + 120),
    }]
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // No Rural a lista de salas chega depois; preenche a sala principal assim que disponível
  useEffect(() => {
    if (!blocos[0]!.sala && salas.length > 0) {
      setBlocos((prev) => prev.map((b, i) => (i === 0 ? { ...b, sala: salas[0]! } : b)))
    }
  }, [salas, blocos])

  function setBloco(idx: number, value: HorarioValue) {
    setBlocos((prev) => prev.map((b, i) => (i === idx ? value : b)))
  }

  // Marca/desmarca o bloco seguinte ao `idx`; desmarcar remove também os posteriores
  function toggleExtra(idx: number) {
    if (blocos.length > idx + 1) {
      setBlocos(blocos.slice(0, idx + 1))
      return
    }
    const principal = blocos[0]!
    const usados = blocos.map((b) => b.dia)
    const proximoDia = DIAS_UTEIS.find((d) => !usados.includes(d)) ?? principal.dia
    setBlocos([...blocos, { ...principal, dia: proximoDia }])
  }

  const inputs: AlocacaoInput[] = blocos.map((b) => ({
    disciplina: disciplina.trim(),
    professor: professor.trim() || null,
    curso: curso.trim() || null,
    dia_semana: b.dia,
    sala: b.sala,
    inicio: b.inicio,
    fim: b.fim,
  }))
  const erros = conflitosDoLote(inputs, alocacoes, reservas)
  const temErro = erros.some((e) => e !== null)
  const blocked = saving || loading || temErro

  async function handleSave() {
    if (!disciplina.trim()) { setError('Disciplina é obrigatória.'); return }
    if (!curso.trim()) { setError('Curso é obrigatório.'); return }
    if (inputs.some((i) => !i.sala)) { setError('Selecione a sala.'); return }
    if (temErro) { setError('Corrija os choques de horário antes de salvar.'); return }
    setSaving(true)
    setError(null)
    try {
      await ctx.insertMany(inputs)
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const multiplas = blocos.length > 1

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
        Período: <Text style={{ fontWeight: '700', color: accent.color }}>{periodo}</Text>
      </Text>

      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 }}>
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

      {blocos.map((bloco, idx) => (
        <View
          key={idx}
          style={multiplas ? { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12 } : undefined}
        >
          {multiplas && (
            <Text style={{ fontSize: 12, fontWeight: '700', color: accent.color, marginBottom: 10 }}>Alocação {idx + 1}</Text>
          )}
          <HorarioFields value={bloco} onChange={(v) => setBloco(idx, v)} salas={salas} erro={erros[idx]} />
          {idx < MAX_ALOCACOES - 1 ? (
            <Checkbox
              checked={blocos.length > idx + 1}
              label={idx === 0 ? 'Alocar em outro dia/horário' : 'Alocar em mais um dia/horário'}
              color={accent.color}
              onPress={() => toggleExtra(idx)}
            />
          ) : null}
        </View>
      ))}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
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
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{ color: 'white', fontWeight: '700' }}>{multiplas ? `Salvar ${blocos.length} alocações` : 'Salvar'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  )
}
