import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { cop } from '@/lib/format'
import { clientesPorId, nombre } from '@/lib/labels'
import { createWorkOrder } from '../actions'

export default async function NuevoTrabajo({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await requireModule('trabajos')
  const [{ data: quotes }, { data: usadas }, { data: crews }] = await Promise.all([
    supabase.from('quotes').select('id,seq,client_id,total').eq('status', 'aprobada').order('created_at', { ascending: false }),
    supabase.from('work_orders').select('quote_id'),
    supabase.from('crews').select('id,name').eq('active', true).order('name'),
  ])
  const ocupadas = new Set((usadas ?? []).map((u) => u.quote_id))
  const libres = (quotes ?? []).filter((q) => !ocupadas.has(q.id))
  const cl = await clientesPorId(supabase, libres.map((q) => q.client_id))

  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Nuevo trabajo</h1>
      {error && <div className="err">{error}</div>}
      <form action={createWorkOrder} className="card">
        <div className="grid-f">
          <div>
            <label className="lbl">Cotización aprobada</label>
            <select name="quote_id" className="inp" defaultValue="">
              <option value="" disabled>{libres.length ? 'Elegir cotización' : 'No hay cotizaciones aprobadas sin trabajo'}</option>
              {libres.map((q) => (
                <option key={q.id} value={q.id}>{String(q.seq).padStart(3, '0')} - {nombre(cl.get(q.client_id))} - {cop(Number(q.total))}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="lbl">Cuadrilla (opcional)</label>
            <select name="crew_id" className="inp" defaultValue="">
              <option value="">Sin asignar</option>
              {(crews ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn">Crear trabajo</button>
          <Link href="/trabajos" className="btn btn-g">Cancelar</Link>
        </div>
      </form>
    </>
  )
}