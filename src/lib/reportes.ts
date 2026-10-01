type Fila = Record<string, unknown>

export const hoyBogota = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
const valida = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))
const dos = (n: number) => String(n).padStart(2, '0')

export const dmy = (s: string) => s.split('-').reverse().join('/')

// Periodo por defecto: del primer dia del mes a hoy (hora de Colombia).
export function rango(desde?: string, hasta?: string) {
  const hoy = hoyBogota()
  const d = valida(desde) ? desde : hoy.slice(0, 8) + '01'
  const h0 = valida(hasta) ? hasta : hoy
  const h = h0 < d ? d : h0
  return {
    desde: d,
    hasta: h,
    desdeTs: new Date(d + 'T00:00:00-05:00').toISOString(),
    hastaTs: new Date(Date.parse(h + 'T00:00:00-05:00') + 86400000).toISOString(),
  }
}

export function atajos() {
  const hoy = hoyBogota()
  const y = Number(hoy.slice(0, 4)), m = Number(hoy.slice(5, 7))
  const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1
  const ultimo = new Date(Date.UTC(y, m - 1, 0)).getUTCDate()
  return [
    { t: 'Este mes', d: `${y}-${dos(m)}-01`, h: hoy },
    { t: 'Mes pasado', d: `${py}-${dos(pm)}-01`, h: `${py}-${dos(pm)}-${dos(ultimo)}` },
    { t: 'Este año', d: `${y}-01-01`, h: hoy },
  ]
}

export const suma = (rows: Fila[], k: string) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0)

export function agruparSuma(rows: Fila[], clave: string, valor: string): [string, number][] {
  const m = new Map<string, number>()
  for (const r of rows) {
    const c = String(r[clave] ?? 'sin dato')
    m.set(c, (m.get(c) ?? 0) + (Number(r[valor]) || 0))
  }
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
}

export function contar(rows: Fila[], clave: string): [string, number][] {
  const m = new Map<string, number>()
  for (const r of rows) {
    const c = String(r[clave] ?? 'sin dato')
    m.set(c, (m.get(c) ?? 0) + 1)
  }
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
}