// Clasificacion de servicios por nombre: grupo, unidad de la cantidad y nivel de pintura interior.
// No cambia precios: solo decide como se muestran y que unidad se guarda en quote_items.unit.
export type Grupo = 'interior' | 'exterior' | 'preparacion' | 'mantenimiento' | 'otros'

export type InfoServicio = {
  grupo: Grupo
  unidad: string // etiqueta de la cantidad en pantalla
  unidadDb: string // lo que se guarda en quote_items.unit: 'm2' o 'und'
  porPiso: boolean
  nivel: 1 | 2 | 3
  fijo: boolean // valor fijo: la cantidad es 1
}

const sin = (s: unknown) =>
  String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function clasificar(nombre: unknown): InfoServicio {
  const n = sin(nombre)
  const base = { porPiso: false, nivel: 1 as 1 | 2 | 3, fijo: false, unidadDb: 'm\u00b2' }
  if (n.includes('pintura interior')) {
    const porPiso = n.includes('m2 de piso')
    const nivel: 1 | 2 | 3 =
      n.includes('economica') || n.includes('tipo 3') ? 3 : n.includes('estandar') || n.includes('tipo 2') ? 2 : 1
    return { ...base, grupo: 'interior', porPiso, nivel, unidad: porPiso ? 'm\u00b2 de piso' : 'm\u00b2 de paredes y techo' }
  }
  if (n.includes('pintura exterior') || n.includes('fachada')) return { ...base, grupo: 'exterior', unidad: 'm\u00b2 de muro' }
  if (n.includes('altura')) return { ...base, grupo: 'exterior', unidad: 'm\u00b2' }
  if (n.includes('resane') || n.includes('estuco')) return { ...base, grupo: 'preparacion', unidad: 'm\u00b2 de muro' }
  if (n.includes('puertas')) return { ...base, grupo: 'preparacion', unidad: 'unidades', unidadDb: 'und' }
  if (n.includes('humedad')) return { ...base, grupo: 'preparacion', unidad: 'm\u00b2' }
  if (n.includes('trabajo menor') || n.includes('retoque')) {
    return { ...base, grupo: 'mantenimiento', unidad: 'unidad (valor fijo)', unidadDb: 'und', fijo: true }
  }
  if (n.includes('mantenimiento de pisos')) return { ...base, grupo: 'mantenimiento', unidad: 'm\u00b2 de piso' }
  if (n.includes('mantenimiento de techos')) return { ...base, grupo: 'mantenimiento', unidad: 'm\u00b2 de techo' }
  if (n.includes('mantenimiento')) return { ...base, grupo: 'mantenimiento', unidad: 'm\u00b2' }
  return { ...base, grupo: 'otros', unidad: 'm\u00b2' }
}

export const GRUPOS: { id: Grupo; titulo: string; color: string; suave: string }[] = [
  { id: 'interior', titulo: 'PINTURA INTERIOR', color: '#1e3a8a', suave: '#e8eefc' },
  { id: 'exterior', titulo: 'EXTERIOR Y FACHADAS', color: '#c2610c', suave: '#fff1e3' },
  { id: 'preparacion', titulo: 'PREPARACI\u00d3N Y ADICIONALES', color: '#15803d', suave: '#e6f5eb' },
  { id: 'mantenimiento', titulo: 'MANTENIMIENTO', color: '#6d28d9', suave: '#f0e9fc' },
  { id: 'otros', titulo: 'OTROS', color: '#475569', suave: '#eef1f5' },
]

export const NIVELES: { nivel: 1 | 2 | 3; titulo: string }[] = [
  { nivel: 1, titulo: 'Premium (tipo 1)' },
  { nivel: 2, titulo: 'Est\u00e1ndar (tipo 2)' },
  { nivel: 3, titulo: 'Econ\u00f3mica (tipo 3)' },
]