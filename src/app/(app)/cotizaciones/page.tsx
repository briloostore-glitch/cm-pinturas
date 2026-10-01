import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { cop, fdate } from '@/lib/format'

type Row = {
  id: string; seq: number; status: string; total: number; area_m2: number; mode: number; created_at: string
  clients: { first_name: string; last_name: string | null } | null
}

export default async function Cotizaciones() {
  const { supabase } = await requireModule('cotizaciones')
  const { data } = await supabase
    .from('quotes')
    .select('id,seq,status,total,area_m2,mode,created_at,clients(first_name,last_name)')
    .order('created_at', { ascending: false })
    .limit(200)
  const rows = (data ?? []) as unknown as Row[]

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-navy">Cotizaciones</h1>
        <Link href="/cotizaciones/nueva" className="btn btn-o">+ Nueva cotización</Link>
      </div>
      <div className="card overflow-x-auto">
        {rows.length ? (
          <table className="tbl">
            <thead><tr><th>N.º</th><th>Fecha</th><th>Cliente</th><th>Área</th><th>Modalidad</th><th>Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{String(r.seq).padStart(3, '0')}</td>
                  <td>{fdate(r.created_at)}</td>
                  <td>{r.clients?.first_name} {r.clients?.last_name}</td>
                  <td>{r.area_m2} m²</td>
                  <td>{r.mode === 1 ? 'M.O. + materiales' : 'Solo M.O.'}</td>
                  <td>{cop(Number(r.total))}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td><Link href={`/cotizaciones/${r.id}`} className="btn btn-g">Ver</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-center text-slate-500 p-4">Aún no hay cotizaciones.</p>}
      </div>
    </>
  )
}