// Area informada por el cliente vs area que se cobra (m2).
export const FACTOR_PISO = 2.7

const sinAcentos = (s: unknown) =>
  String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Servicio cotizado sobre el area de piso, p. ej. "Pintura interior apartamento (por m2 de piso)"
export function esServicioPiso(nombre: unknown): boolean {
  return sinAcentos(nombre).includes('m2 de piso')
}

// Separador de miles colombiano (punto) y coma decimal
export function m2(n: number): string {
  const r = Math.round(n * 100) / 100
  const [ent, dec] = String(r).split('.')
  const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return dec ? miles + ',' + dec : miles
}