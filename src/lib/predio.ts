// Prédio de uma sala do SAGE Rural = prefixo antes de " - " (ex.: "CEGOE - SALA 05" → "CEGOE")
export function predioDaSala(sala: string): string | null {
  const idx = sala.indexOf(' - ')
  return idx > 0 ? sala.slice(0, idx).trim() : null
}

// Ordem natural de nomes de sala (SALA 2 antes de SALA 10)
export function ordenarSalas(salas: string[]): string[] {
  return [...salas].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
}
