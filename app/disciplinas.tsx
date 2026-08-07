import { useMemo, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAlocacoes } from '../src/hooks/useAlocacoes'
import { DIAS } from '../src/constants/salas'
import { normalize } from '../src/lib/normalize'
import { usePeriodo } from '../src/contexts/PeriodoContext'
import type { Alocacao } from '../src/types'

const DIA_SHORT: Record<string, string> = {
  SEGUNDA: 'Seg', TERÇA: 'Ter', QUARTA: 'Qua',
  QUINTA: 'Qui', SEXTA: 'Sex', SÁBADO: 'Sáb',
}

interface Horario {
  dia: string
  inicio: string
  fim: string
  sala: string
}

interface DisciplinaGrupo {
  key: string
  disciplina: string
  nomeSemCodigo: string
  professor: string
  curso: string
  semestre: number | null
  horarios: Horario[]
}

function stripCodigo(disciplina: string): string {
  return disciplina.replace(/^\d+\s*-\s*/, '').trim()
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function agruparDisciplinas(alocacoes: Alocacao[]): DisciplinaGrupo[] {
  const grupos = new Map<string, DisciplinaGrupo>()

  for (const a of alocacoes) {
    if (a.curso === 'BSI') continue
    const professor = a.professor?.trim() || 'A DEFINIR'
    const curso = a.curso ?? '-'
    const semestre = a.semestre
    const key = `${a.disciplina}||${professor}||${curso}||${semestre}`

    let grupo = grupos.get(key)
    if (!grupo) {
      grupo = {
        key,
        disciplina: a.disciplina,
        nomeSemCodigo: stripCodigo(a.disciplina),
        professor,
        curso,
        semestre,
        horarios: [],
      }
      grupos.set(key, grupo)
    }
    grupo.horarios.push({ dia: a.dia_semana, inicio: a.inicio, fim: a.fim, sala: a.sala })
  }

  const lista = Array.from(grupos.values())
  for (const g of lista) {
    g.horarios.sort((h1, h2) => {
      const diaDiff = DIAS.indexOf(h1.dia as (typeof DIAS)[number]) - DIAS.indexOf(h2.dia as (typeof DIAS)[number])
      if (diaDiff !== 0) return diaDiff
      return timeToMinutes(h1.inicio) - timeToMinutes(h2.inicio)
    })
  }

  return lista.sort((a, b) => a.nomeSemCodigo.localeCompare(b.nomeSemCodigo, 'pt-BR'))
}

function DisciplinaRow({ item }: { item: DisciplinaGrupo }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 8,
      }}
    >
      <View style={{ flex: 3 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{item.disciplina}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: '#374151' }}>{item.curso}</Text>
      </View>
      <View style={{ flex: 0.7 }}>
        <Text style={{ fontSize: 12, color: '#374151' }}>{item.semestre ?? '-'}</Text>
      </View>
      <View style={{ flex: 2.2 }}>
        {item.horarios.map((h, i) => (
          <Text key={i} style={{ fontSize: 11, color: '#374151', marginBottom: i < item.horarios.length - 1 ? 2 : 0 }}>
            {DIA_SHORT[h.dia] ?? h.dia} · {h.inicio.slice(0, 5)}-{h.fim.slice(0, 5)} · {h.sala}
          </Text>
        ))}
      </View>
      <View style={{ flex: 1.6 }}>
        <Text style={{ fontSize: 12, color: '#374151' }}>{item.professor}</Text>
      </View>
    </View>
  )
}

export default function DisciplinasScreen() {
  const { alocacoes, loading, error } = useAlocacoes()
  const { periodo } = usePeriodo()
  const [search, setSearch] = useState('')

  const grupos = useMemo(() => agruparDisciplinas(alocacoes), [alocacoes])

  const filtrados = useMemo(() => {
    if (!search.trim()) return grupos
    const q = normalize(search)
    return grupos.filter((g) => normalize(g.disciplina).includes(q) || normalize(g.professor).includes(q))
  }, [grupos, search])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['left', 'right', 'bottom']}>
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, gap: 8 }}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Filtrar por disciplina ou professor..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, padding: 10, fontSize: 13, color: '#111827' }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
          {filtrados.length} disciplina{filtrados.length === 1 ? '' : 's'}{periodo ? ` · ${periodo}` : ''}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#DC2626', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8 }}>
            <Text style={{ flex: 3, fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Disciplina</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Curso</Text>
            <Text style={{ flex: 0.7, fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Sem.</Text>
            <Text style={{ flex: 2.2, fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Dia · Horário · Sala</Text>
            <Text style={{ flex: 1.6, fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Professor(a)</Text>
          </View>
          <FlatList
            data={filtrados}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => <DisciplinaRow item={item} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="school-outline" size={40} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Nenhuma disciplina encontrada.</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  )
}
