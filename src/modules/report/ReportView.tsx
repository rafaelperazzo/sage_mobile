import { useState, type ReactNode } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { CartesianChart, Bar } from 'victory-native'
import type { ReportSummary, RoomOccupancy } from './occupancyUtils'
import { MAX_HORAS_DIA } from './occupancyUtils'

// `type` (não `interface`): o CartesianChart exige Record<string, unknown>, que interfaces não satisfazem
export type ChartItem = {
  label: string
  percentual: number
  color: string
}

interface ReportViewProps {
  summary: ReportSummary
  totalAlocacoes: number
  chartData: ChartItem[]
  corDaSala: (s: RoomOccupancy) => string
  legenda?: { label: string; color: string }[]
  agruparPorGrupo?: boolean     // lista com cabeçalho por grupo (prédio, no SAGE Rural)
  header?: ReactNode            // filtros acima do resumo (ex.: prédios)
}

function OccupancyBar({ percentual, color }: { percentual: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(percentual, 100)}%` as `${number}%`, height: 8, backgroundColor: color, borderRadius: 4 }} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color, width: 36, textAlign: 'right' }}>{percentual}%</Text>
    </View>
  )
}

// Resumo, gráfico, detalhe por dia e lista de salas — compartilhado entre SAGE Map e SAGE Rural
export function ReportView({ summary, totalAlocacoes, chartData, corDaSala, legenda, agruparPorGrupo, header }: ReportViewProps) {
  const [selectedSala, setSelectedSala] = useState<string | null>(null)
  const { salas, totalGeralHoras, mediaOcupacao } = summary
  const selected = selectedSala ? salas.find((s) => s.sala === selectedSala) : null

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      {header}

      {/* Resumo */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16 }}>
        {[
          { label: 'Alocações', value: totalAlocacoes },
          { label: 'Horas Totais', value: `${totalGeralHoras.toFixed(0)}h` },
          { label: 'Média Ocupação', value: `${mediaOcupacao}%` },
        ].map((stat) => (
          <View key={stat.label} style={{ flex: 1, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#059669' }}>{stat.value}</Text>
            <Text style={{ fontSize: 10, color: '#065F46', marginTop: 2, textAlign: 'center' }}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <Text style={{ fontSize: 10, color: '#9CA3AF', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        Capacidade de {MAX_HORAS_DIA}h/dia (seg–sex). À noite, cada bloco (18:30–20:10 e 20:10–21:50) com aula conta 2h.
      </Text>

      {/* Legenda */}
      {legenda && legenda.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 8 }}>
          {legenda.map((l) => (
            <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: l.color }} />
              <Text style={{ fontSize: 10, color: '#6B7280' }}>{l.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Gráfico de barras com CartesianChart */}
      {chartData.length > 0 && (
        <View style={{ height: 240, marginHorizontal: 8 }}>
          <CartesianChart
            data={chartData}
            xKey="label"
            yKeys={['percentual']}
            domain={{ y: [0, 100] }}
            domainPadding={{ left: 10, right: 10 }}
            axisOptions={{
              tickCount: 5,
              formatYLabel: (v) => `${v}%`,
              formatXLabel: (v) => String(v),
              labelColor: '#9CA3AF',
              lineColor: '#F3F4F6',
            }}
          >
            {({ points, chartBounds }) =>
              points.percentual.map((point, i) => (
                <Bar
                  key={i}
                  points={[point]}
                  chartBounds={chartBounds}
                  color={chartData[i]?.color ?? '#6B7280'}
                  roundedCorners={{ topLeft: 3, topRight: 3 }}
                />
              ))
            }
          </CartesianChart>
        </View>
      )}

      {/* Detalhe da sala selecionada */}
      {selected && (
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827', flex: 1 }}>{selected.sala}</Text>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>{selected.totalHoras.toFixed(1)}h / semana</Text>
          </View>
          {Object.entries(selected.porDia).map(([dia, horas]) => (
            <View key={dia} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 11, color: '#374151', fontWeight: '600' }}>{dia}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{horas.toFixed(1)}h</Text>
              </View>
              <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min((horas / MAX_HORAS_DIA) * 100, 100)}%` as `${number}%`, height: 6, backgroundColor: corDaSala(selected), borderRadius: 3 }} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Lista de salas */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>
          {salas.length === 0 ? 'Nenhuma sala encontrada' : 'Todas as salas'}
        </Text>
        {salas.map((sala, i) => {
          const novoGrupo = agruparPorGrupo && (i === 0 || salas[i - 1]!.grupo !== sala.grupo)
          const cor = corDaSala(sala)
          const isSelected = selectedSala === sala.sala
          return (
            <View key={sala.sala}>
              {novoGrupo && (
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B7280', marginTop: i === 0 ? 0 : 8, marginBottom: 6, letterSpacing: 0.3 }}>
                  {sala.grupo}
                </Text>
              )}
              <TouchableOpacity
                onPress={() => setSelectedSala((prev) => (prev === sala.sala ? null : sala.sala))}
                style={{ backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: isSelected ? '#86EFAC' : '#E5E7EB' }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cor }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', flex: 1 }} numberOfLines={1}>{sala.sala}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>{sala.totalHoras.toFixed(1)}h</Text>
                </View>
                <OccupancyBar percentual={sala.percentual} color={cor} />
              </TouchableOpacity>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
