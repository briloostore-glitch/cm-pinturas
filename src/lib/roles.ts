export type Role = 'administrador' | 'supervisor' | 'cotizador' | 'almacen' | 'contabilidad' | 'trabajador'

export const ROLE_LABEL: Record<Role, string> = {
  administrador: 'Administrador',
  supervisor: 'Supervisor',
  cotizador: 'Cotizador',
  almacen: 'Almacén',
  contabilidad: 'Contabilidad',
  trabajador: 'Trabajador',
}
export const ROLES = Object.keys(ROLE_LABEL) as Role[]

const A: Role = 'administrador'
const S: Role = 'supervisor'
const C: Role = 'cotizador'
const W: Role = 'almacen'
const K: Role = 'contabilidad'
const T: Role = 'trabajador'

export type NavItem = { slug: string; label: string; icon: string; roles: Role[]; phase: number }

// Qué módulo ve cada rol (la base de datos también lo protege con RLS)
export const NAV: NavItem[] = [
  { slug: 'panel', label: 'Panel', icon: '', roles: [A, S, C, W, K], phase: 3 },
  { slug: 'clientes', label: 'Clientes', icon: '', roles: [A, S, C], phase: 4 },
  { slug: 'cotizaciones', label: 'Cotizaciones', icon: '', roles: [A, S, C], phase: 4 },
  { slug: 'solicitudes', label: 'Solicitudes', icon: '', roles: [A, S, C], phase: 4 },
  { slug: 'visitas', label: 'Visitas técnicas', icon: '', roles: [A, S, C], phase: 5 },
  { slug: 'trabajos', label: 'Trabajos', icon: '', roles: [A, S, T], phase: 5 },
  { slug: 'inventario', label: 'Inventario', icon: '', roles: [A, W], phase: 6 },
  { slug: 'proveedores', label: 'Proveedores', icon: '', roles: [A, W], phase: 6 },
  { slug: 'personal', label: 'Personal', icon: '', roles: [A, K], phase: 7 },
  { slug: 'nomina', label: 'Nómina', icon: '', roles: [A, K], phase: 7 },
  { slug: 'gastos', label: 'Gastos', icon: '', roles: [A, K], phase: 7 },
  { slug: 'facturacion', label: 'Facturación y pagos', icon: '', roles: [A, K], phase: 8 },
  { slug: 'reportes', label: 'Reportes', icon: '', roles: [A, S, K], phase: 9 },
  { slug: 'precios', label: 'Precios', icon: '', roles: [A], phase: 4 },
  { slug: 'usuarios', label: 'Usuarios', icon: '', roles: [A], phase: 3 },
]

export const homeFor = (r: Role) => (r === 'trabajador' ? '/trabajos' : '/panel')
