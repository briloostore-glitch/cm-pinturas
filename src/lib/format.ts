export const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export const fdate = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Bogota' })

export const toMsg = (m: string) => encodeURIComponent(m)

const U = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE']
const D = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const C = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function w3(n: number): string {
  if (n === 100) return 'CIEN'
  const c = Math.floor(n / 100), r = n % 100
  let s = C[c]
  if (r) s += (s ? ' ' : '') + (r < 30 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ' Y ' + U[r % 10] : ''))
  return s
}

export function pesosEnLetras(n: number): string {
  n = Math.round(n)
  if (!n) return 'CERO PESOS M/CTE'
  const a = Math.floor(n / 1e6), b = Math.floor((n % 1e6) / 1e3), u = n % 1e3
  let s = ''
  if (a) s += (a === 1 ? 'UN MILLÓN' : w3(a) + ' MILLONES') + ' '
  if (b) s += (b === 1 ? '' : w3(b) + ' ') + 'MIL '
  if (u) s += w3(u)
  return (s.trim() + (n % 1e6 === 0 ? ' DE' : '') + ' PESOS M/CTE').replace(/\s+/g, ' ')
}