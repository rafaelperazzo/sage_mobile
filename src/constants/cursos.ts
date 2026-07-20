export const CURSOS = ['BCC', 'LC'] as const

export type Curso = (typeof CURSOS)[number]
