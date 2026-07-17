export interface CursoColor {
  bg: string
  border: string
  accent: string
}

// Paleta categórica fixa (8 matizes), validada com o script de contraste/daltonismo
// do skill de dataviz: ΔE mínimo entre vizinhos 9.1 (CVD) / 19.6 (visão normal).
// `accent` carrega a identidade (barra/ponto) — nunca usado como cor de texto, para não
// precisar escurecer o matiz (o que embaralha tons próximos, ex. verde/água, laranja/vermelho).
// A ordem nunca é ciclada por render — cada curso é mapeado para um slot fixo via hash.
const PALETTE: CursoColor[] = [
  { bg: '#EAF2FB', border: '#8AB5E8', accent: '#2A78D6' }, // azul
  { bg: '#E6F3E6', border: '#73BB73', accent: '#008300' }, // verde
  { bg: '#FDF2F6', border: '#F2B6CD', accent: '#E87BA4' }, // magenta
  { bg: '#FDF6E6', border: '#F5CB73', accent: '#EDA100' }, // amarelo
  { bg: '#E8F7F2', border: '#82D3B6', accent: '#1BAF7A' }, // água
  { bg: '#FDF0EB', border: '#F4AC8F', accent: '#EB6834' }, // laranja
  { bg: '#EDEBF6', border: '#9B93CF', accent: '#4A3AA7' }, // violeta
  { bg: '#FCEDED', border: '#F09B9A', accent: '#E34948' }, // vermelho
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Retorna a cor determinística de um curso, ou null se o curso não estiver definido. */
export function getCursoColor(curso: string | null | undefined): CursoColor | null {
  if (!curso) return null
  return PALETTE[hashString(curso) % PALETTE.length]!
}
