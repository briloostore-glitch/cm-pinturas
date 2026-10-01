import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { cop, fdate } from '@/lib/format'
import { clientesPorId, nombre, estado } from '@/lib/labels'

export default async function Trabajos() {
  const { supabase } = await requireModule('trabajos')
  const [{ data }, { data: crews }] = await Promise.all([
    supabase.from('work_orders').select('id,seq,client_id,crew_id,status,start_date,end_date,sale_total,created_at').order('created_at', { ascending: false }).limit(200),
    supabase.from('crews').select('id,name'),
  ])
  const rows = data ?? []
  const cl = await clientesPorId(supabase, rows.map((r) => r.client_id))
  const cr = new Map((crews ?? []).map((c) => [c.id, c.name as string]))

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-navy">Trabajos</h1>
        <Link href="/trabajos/nuevo" className="btn btn-o">Nuevo trabajo</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>N°</th><th>Cliente</th><th>Estado</th><th>Cuadrilla</th><th>Inicio</th><th>Fin</th><th>Venta</th><th></th></tr></thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td>{String(w.seq).padStart(3, '0')}</td>
                <td>{nombre(cl.get(w.client_id))}</td>
                <td><span className="badge">{estado(w.status)}</span></td>
                <td>{w.crew_id ? cr.get(w.crew_id) ?? '-' : '-'}</td>
                <td>{w.start_date ? fdate(w.start_date) : '-'}</td>
                <td>{w.end_date ? fdate(w.end_date) : '-'}</td>
                <td>{cop(Number(w.sale_total))}</td>
                <td><Link href={`/trabajos/${w.id}`} className="btn btn-g">Abrir</Link></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="text-slate-500">Aún no hay trabajos.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}