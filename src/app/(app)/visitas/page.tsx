import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { cop, fdate } from '@/lib/format'
import { clientesPorId, nombre, estado } from '@/lib/labels'

export default async function Visitas() {
  const { supabase } = await requireModule('visitas')
  const { data } = await supabase.from('visits')
    .select('id,seq,client_id,status,price,paid_at,scheduled_at,created_at')
    .order('created_at', { ascending: false }).limit(200)
  const rows = data ?? []
  const cl = await clientesPorId(supabase, rows.map((r) => r.client_id))

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-navy">Visitas técnicas</h1>
        <Link href="/visitas/nueva" className="btn btn-o">Nueva visita</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>N°</th><th>Cliente</th><th>Estado</th><th>Valor</th><th>Pago</th><th>Agendada</th><th></th></tr></thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td>{String(v.seq).padStart(3, '0')}</td>
                <td>{nombre(cl.get(v.client_id))}</td>
                <td><span className="badge">{estado(v.status)}</span></td>
                <td>{cop(Number(v.price))}</td>
                <td>{v.paid_at ? fdate(v.paid_at) : 'Pendiente'}</td>
                <td>{v.scheduled_at ? fdate(v.scheduled_at) : '-'}</td>
                <td><Link href={`/visitas/${v.id}`} className="btn btn-g">Abrir</Link></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="text-slate-500">Aún no hay visitas.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}