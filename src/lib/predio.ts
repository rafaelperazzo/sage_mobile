// Grupo das salas sem prefixo de prédio
export const SEM_PREDIO = 'Outras'

// Prédio de uma sala do SAGE Rural = prefixo antes de " - " (ex.: "CEGOE - SALA 05" → "CEGOE")
export function predioDaSala(sala: string): string | null {
  const idx = sala.indexOf(' - ')
  return idx > 0 ? sala.slice(0, idx).trim() : null
}

// Nome da sala sem o prefixo do prédio (ex.: "CEGOE - SALA 05" → "SALA 05")
export function nomeSemPredio(sala: string): string {
  const idx = sala.indexOf(' - ')
  return idx > 0 ? sala.slice(idx + 3).trim() : sala
}

// Ordem natural de nomes de sala (SALA 2 antes de SALA 10)
export function ordenarSalas(salas: string[]): string[] {
  return [...salas].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
}
