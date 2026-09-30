import type { Alocacao, ModuloReserva } from '../../../types'
import { DIAS, HORAS, getSalaInfo } from '../../../constants/salas'
import { getCursoColor } from '../../../lib/cursoColors'
import { timeToMinutes } from '../gridUtils'

export interface PaginaGrade {
  sala: string
  alocacoes: Alocacao[]
}

interface GerarHtmlGradeOptions {
  modulo: ModuloReserva
  periodo: string
  paginas: PaginaGrade[]
  predio?: string        // preenchido no PDF de prédio (SAGE Rural)
}

// Medidas em mm para A4 paisagem (297×210) com margem de 10mm → área útil 277×190
const FIRST_HOUR = 7
const ROW_MM = 10.9          // altura de 1h na grade (15 linhas → ~164mm)
const HOUR_COL_MM = 13
const DAY_HEADER_MM = 6
const GRID_MM = HORAS.length * ROW_MM

const DIAS_UTEIS = DIAS.filter((d) => d !== 'SÁBADO')

const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda',
  TERÇA: 'Terça',
  QUARTA: 'Quarta',
  QUINTA: 'Quinta',
  SEXTA: 'Sexta',
  SÁBADO: 'Sábado',
}

// Fallback por tipo de sala quando a alocação não tem curso (mesmas cores da AllocationCard)
const TIPO_COR: Record<string, { bg: string; border: string; accent: string }> = {
  sala_aula: { bg: '#EFF6FF', border: '#BFDBFE', accent: '#1D4ED8' },
  sala_inovacao: { bg: '#F5F3FF', border: '#DDD6FE', accent: '#6D28D9' },
  laboratorio: { bg: '#ECFDF5', border: '#A7F3D0', accent: '#065F46' },
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function corDaAlocacao(a: Alocacao) {
  const curso = getCursoColor(a.curso?.trim())
  if (curso) return curso
  return TIPO_COR[getSalaInfo(a.sala)?.tipo ?? 'sala_aula']!
}

function formatAgora(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function blocoHtml(a: Alocacao): string {
  const inicioMin = timeToMinutes(a.inicio)
  const fimMin = timeToMinutes(a.fim)
  const gridIni = FIRST_HOUR * 60
  const gridFim = gridIni + HORAS.length * 60
  const ini = Math.max(inicioMin, gridIni)
  const fim = Math.min(fimMin, gridFim)
  if (fim <= ini) return ''

  const top = ((ini - gridIni) / 60) * ROW_MM
  const height = ((fim - ini) / 60) * ROW_MM - 0.6
  const curto = fimMin - inicioMin < 60
  const cor = corDaAlocacao(a)
  const curso = a.curso?.trim()
  const horario = `${a.inicio.slice(0, 5)}–${a.fim.slice(0, 5)}`

  return `
    <div class="bloco" style="top:${top.toFixed(2)}mm;height:${height.toFixed(2)}mm;background:${cor.bg};border-color:${cor.border};border-left-color:${cor.accent}">
      <div class="disc">${escapeHtml(a.disciplina)}</div>
      ${!curto && a.professor ? `<div class="linha">${escapeHtml(a.professor)}</div>` : ''}
      <div class="linha">${horario}${!curto && curso ? ` · ${escapeHtml(curso)}` : ''}</div>
    </div>`
}

function paginaHtml(p: PaginaGrade, dias: string[], opts: GerarHtmlGradeOptions, geradoEm: string, ultima: boolean): string {
  const titulo = opts.modulo === 'map' ? 'SAGE Map' : 'SAGE Rural'
  const cursos = Array.from(new Set(p.alocacoes.map((a) => a.curso?.trim()).filter((c): c is string => !!c))).sort()

  const horas = [...HORAS, `${String(FIRST_HOUR + HORAS.length).padStart(2, '0')}:00`]
    .map((h, i) => `<div class="hora" style="top:${(i * ROW_MM).toFixed(2)}mm">${h}</div>`)
    .join('')
  const linhas = HORAS.map((_, i) => `<div class="linha-grade" style="top:${(i * ROW_MM).toFixed(2)}mm"></div>`).join('')

  const colunas = dias
    .map((dia) => {
      const blocos = p.alocacoes.filter((a) => a.dia_semana === dia).map(blocoHtml).join('')
      return `
        <div class="dia">
          <div class="dia-header">${DIA_LABEL[dia] ?? dia}</div>
          <div class="dia-corpo" style="height:${GRID_MM}mm">${linhas}${blocos}</div>
        </div>`
    })
    .join('')

  const legenda = cursos.length
    ? cursos
        .map((c) => `<span class="leg"><span class="ponto" style="background:${getCursoColor(c)!.accent}"></span>${escapeHtml(c)}</span>`)
        .join('')
    : ''

  return `
  <section class="pagina${ultima ? '' : ' quebra'}">
    <header>
      <div>
        <div class="sistema">${titulo}${opts.predio ? ` · Prédio ${escapeHtml(opts.predio)}` : ''}</div>
        <div class="sala">${escapeHtml(p.sala)}</div>
      </div>
      <div class="meta">
        <div>Período <b>${escapeHtml(opts.periodo)}</b></div>
        <div>Gerado em ${geradoEm}</div>
      </div>
    </header>
    <div class="grade">
      <div class="horas" style="width:${HOUR_COL_MM}mm">
        <div style="height:${DAY_HEADER_MM}mm"></div>
        <div style="position:relative;height:${GRID_MM}mm">${horas}</div>
      </div>
      ${colunas}
    </div>
    <footer>
      <div class="legenda">${legenda}</div>
      <div class="total">${p.alocacoes.length} alocaç${p.alocacoes.length === 1 ? 'ão' : 'ões'}</div>
    </footer>
  </section>`
}

/**
 * Gera o HTML (A4 paisagem, uma sala por página) da grade semanal, para o expo-print converter em PDF.
 * A coluna de sábado entra em todas as páginas quando alguma alocação do documento cai no sábado.
 */
export function gerarHtmlGrade(opts: GerarHtmlGradeOptions): string {
  const temSabado = opts.paginas.some((p) => p.alocacoes.some((a) => a.dia_semana === 'SÁBADO'))
  const dias: string[] = temSabado ? [...DIAS_UTEIS, 'SÁBADO'] : [...DIAS_UTEIS]
  const geradoEm = formatAgora()

  const paginas = opts.paginas
    .map((p, i) => paginaHtml(p, dias, opts, geradoEm, i === opts.paginas.length - 1))
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pagina { width: 277mm; height: 190mm; display: flex; flex-direction: column; overflow: hidden; }
  .quebra { page-break-after: always; break-after: page; }
  header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 2mm; margin-bottom: 2mm; border-bottom: 0.4mm solid #111827; }
  .sistema { font-size: 8pt; color: #6B7280; font-weight: 600; letter-spacing: 0.3pt; text-transform: uppercase; }
  .sala { font-size: 16pt; font-weight: 800; }
  .meta { text-align: right; font-size: 8pt; color: #374151; line-height: 1.4; }
  .grade { display: flex; }
  .horas .hora { position: absolute; right: 0; transform: translateY(-50%); font-size: 6.5pt; color: #6B7280; padding-right: 1.5mm; font-variant-numeric: tabular-nums; }
  .dia { flex: 1; border-left: 0.2mm solid #D1D5DB; }
  .dia:last-child { border-right: 0.2mm solid #D1D5DB; }
  .dia-header { height: ${DAY_HEADER_MM}mm; background: #F3F4F6; font-size: 8pt; font-weight: 700; display: flex; align-items: center; justify-content: center; border-bottom: 0.2mm solid #D1D5DB; border-top: 0.2mm solid #D1D5DB; }
  .dia-corpo { position: relative; border-bottom: 0.2mm solid #D1D5DB; }
  .linha-grade { position: absolute; left: 0; right: 0; border-top: 0.15mm solid #E5E7EB; }
  .bloco { position: absolute; left: 0.6mm; right: 0.6mm; border: 0.2mm solid; border-left-width: 0.8mm; border-radius: 0.8mm; padding: 0.5mm 0.8mm; overflow: hidden; }
  .disc { font-size: 6.5pt; font-weight: 700; line-height: 1.15; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .linha { font-size: 5.8pt; color: #4B5563; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  footer { margin-top: auto; padding-top: 2mm; display: flex; justify-content: space-between; align-items: center; font-size: 7pt; color: #374151; }
  .legenda { display: flex; flex-wrap: wrap; gap: 1.5mm 4mm; }
  .leg { display: inline-flex; align-items: center; gap: 1mm; }
  .ponto { width: 2.2mm; height: 2.2mm; border-radius: 50%; display: inline-block; }
  .total { color: #6B7280; }
</style>
</head>
<body>${paginas}</body>
</html>`
}
