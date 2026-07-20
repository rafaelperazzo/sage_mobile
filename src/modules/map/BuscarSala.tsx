import { useState, useMemo, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import type { Alocacao } from '../../types'
import { DIAS, getSalaInfo, TIPO_LABEL } from '../../constants/salas'
import { timeToMinutes } from './gridUtils'
import { normalize } from '../../lib/normalize'

const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda',
  TERÇA: 'Terça',
  QUARTA: 'Quarta',
  QUINTA: 'Quinta',
  SEXTA: 'Sexta',
  SÁBADO: 'Sábado',
}

const TIPO_BG: Record<string, string> = {
  sala_aula: '#EFF6FF',
  sala_inovacao: '#F5F3FF',
  laboratorio: '#ECFDF5',
}
const TIPO_BORDER: Record<string, string> = {
  sala_aula: '#BFDBFE',
  sala_inovacao: '#DDD6FE',
  laboratorio: '#A7F3D0',
}
const TIPO_TEXT: Record<string, string> = {
  sala_aula: '#1D4ED8',
  sala_inovacao: '#6D28D9',
  laboratorio: '#065F46',
}

interface BuscarSalaProps {
  alocacoes: Alocacao[]
  loading: boolean
  error: string | null
  isAdmin: boolean
}

function SalaResultCard({ alocacao, isAdmin }: { alocacao: Alocacao; isAdmin: boolean }) {
  const info = getSalaInfo(alocacao.sala)
  const tipo = info?.tipo ?? 'sala_aula'
  const tipoLabel = TIPO_LABEL[tipo]

  function handlePress() {
    if (isAdmin) {
      router.push({ pathname: '/map/[id]/edit', params: { id: alocacao.id, sala: alocacao.sala } } as never)
    } else {
      router.push({ pathname: '/map/[id]/view', params: { id: alocacao.id } } as never)
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={{
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            backgroundColor: TIPO_BG[tipo],
            borderWidth: 1,
            borderColor: TIPO_BORDER[tipo],
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: TIPO_TEXT[tipo] }}>{alocacao.sala}</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{tipoLabel}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
          {DIA_LABEL[alocacao.dia_semana] ?? alocacao.dia_semana}
        </Text>
        <Text style={{ fontSize: 13, color: '#6B7280' }}>
          {alocacao.inicio.slice(0, 5)}–{alocacao.fim.slice(0, 5)}
        </Text>
      </View>

      {alocacao.professor && (
        <Text style={{ fontSize: 12, color: '#6B7280' }} numberOfLines={1}>
          {alocacao.professor}
        </Text>
      )}
    </TouchableOpacity>
  )
}

export function BuscarSala({ alocacoes, loading, error, isAdmin }: BuscarSalaProps) {
  const [query, setQuery] = useState('')
  const [selectedDisciplina, setSelectedDisciplina] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const disciplinas = useMemo(() => {
    const set = new Set<string>()
    for (const a of alocacoes) set.add(a.disciplina)
    return Array.from(set).sort()
  }, [alocacoes])

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = normalize(query)
    return disciplinas.filter((d) => normalize(d).includes(q)).slice(0, 8)
  }, [query, disciplinas])

  const alocacoesDisciplina = useMemo(() => {
    if (!selectedDisciplina) return []
    return alocacoes
      .filter((a) => a.disciplina === selectedDisciplina)
      .sort((a, b) => {
        const diaDiff = DIAS.indexOf(a.dia_semana as (typeof DIAS)[number]) - DIAS.indexOf(b.dia_semana as (typeof DIAS)[number])
        if (diaDiff !== 0) return diaDiff
        return timeToMinutes(a.inicio) - timeToMinutes(b.inicio)
      })
  }, [alocacoes, selectedDisciplina])

  function handleSelect(disciplina: string) {
    setQuery(disciplina)
    setSelectedDisciplina(disciplina)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setShowSuggestions(true)
    if (value !== selectedDisciplina) setSelectedDisciplina('')
  }

  function handleClear() {
    setQuery('')
    setSelectedDisciplina('')
    setShowSuggestions(false)
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Busca */}
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', zIndex: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
          Buscar por disciplina
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, gap: 8 }}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleQueryChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Digite o nome da disciplina..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, padding: 10, fontSize: 13, color: '#111827' }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sugestões */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginTop: 4, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
            {suggestions.map((d, idx) => (
              <TouchableOpacity
                key={d}
                onPress={() => handleSelect(d)}
                style={{ paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: idx > 0 ? 0.5 : 0, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' }}
              >
                <Text style={{ fontSize: 13, color: '#111827' }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Conteúdo */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#DC2626', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : !selectedDisciplina ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Ionicons name="search" size={48} color="#E5E7EB" />
          <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
            Pesquise e selecione uma disciplina para ver as salas.
          </Text>
          <Text style={{ color: '#C4B5FD', marginTop: 6, fontSize: 12 }}>
            {disciplinas.length} disciplinas disponíveis
          </Text>
        </View>
      ) : alocacoesDisciplina.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Ionicons name="calendar-outline" size={40} color="#E5E7EB" />
          <Text style={{ color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
            Nenhuma alocação encontrada para {selectedDisciplina}.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F5F3FF', borderBottomWidth: 1, borderBottomColor: '#DDD6FE' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#6D28D9' }}>
              {alocacoesDisciplina.length} alocação(ões) — {selectedDisciplina}
            </Text>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 10 }} showsVerticalScrollIndicator>
            {alocacoesDisciplina.map((a) => (
              <SalaResultCard key={a.id} alocacao={a} isAdmin={isAdmin} />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}
