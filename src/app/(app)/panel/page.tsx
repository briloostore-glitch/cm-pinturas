import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { homeFor, NAV } from '@/lib/roles'

const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default async function Panel() {
  const { supabase, profile } = await getSession()
  if (!profile) return null
  if (!NAV.find((n) => n.slug === 'panel')!.roles.includes(profile.role)) redirect(homeFor(profile.role))

  // Cada rol solo recibe los datos que la base de datos le permite ver (RLS)
  const [quotes, clients, orders, visits, mats] = await Promise.all([
    supabase.from('quotes').select('status,total'),
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('work_orders').select('status'),
    supabase.from('visits').select('status'),
    supabase.from('materials').select('stock,min_stock'),
  ])
  const q = quotes.data ?? []
  const approved = q.filter((x) => x.status === 'aprobada')
  const cards: [string, string | number][] = [
    ['Cotizaciones', q.length],
    ['Aprobadas', approved.length],
    ['Pendientes', q.filter((x) => x.status === 'pendiente').length],
    ['Ventas aprobadas', cop(approved.reduce((s, x) => s + Number(x.total), 0))],
    ['Clientes', clients.count ?? 0],
    ['Trabajos activos', (orders.data ?? []).filter((o) => ['programado', 'en_ejecucion'].includes(o.status)).length],
    ['Visitas con pago pendiente', (visits.data ?? []).filter((v) => v.status === 'pago_pendiente').length],
    ['Materiales con stock bajo', (mats.data ?? []).filter((m) => Number(m.stock) <= Number(m.min_stock)).length],
  ]

  return (
    <>
      <h1 className="text-2xl font-bold text-navy">Panel</h1>
      <p className="text-slate-500 mb-5">Hola, {profile.full_name || profile.email}. Este es el resumen de tu operación.</p>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-accent p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-xl font-bold mt-1">{value}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500 mt-6">Los gráficos y las alertas se agregan en las fases siguientes.</p>
    </>
  )
}
