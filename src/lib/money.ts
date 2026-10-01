export const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export const fdate = (d: string) => {
  const [y, m, day] = d.slice(0, 10).split('-')
  return `${day}/${m}/${y}`
}

// Fecha de hoy en Colombia, formato AAAA-MM-DD
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })

export const msg = (m: string) => encodeURIComponent(m)

export const POSITIONS: [string, string][] = [
  ['maestro', 'Maestro'], ['ayudante', 'Ayudante'], ['pintor', 'Pintor'],
  ['tecnico', 'Técnico'], ['supervisor', 'Supervisor'], ['otro', 'Otro'],
]
export const PAY_TYPES: [string, string][] = [['diario', 'Por día'], ['por_trabajo', 'Por trabajo']]
export const EXPENSE_CATS: [string, string][] = [
  ['materiales', 'Materiales'], ['transporte', 'Transporte'], ['mano_de_obra', 'Mano de obra'],
  ['herramientas', 'Herramientas'], ['combustible', 'Combustible'], ['administracion', 'Administración'], ['otros', 'Otros'],
]
export const METHODS: [string, string][] = [
  ['efectivo', 'Efectivo'], ['transferencia', 'Transferencia'], ['nequi', 'Nequi'],
  ['daviplata', 'Daviplata'], ['tarjeta', 'Tarjeta'], ['otro', 'Otro'],
]
export const label = (list: [string, string][], v: string | null) => list.find(([k]) => k === v)?.[1] ?? v ?? ''
