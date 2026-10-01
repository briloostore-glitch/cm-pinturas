import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { cop } from '@/lib/format'
import { clientesPorId, nombre, estado } from '@/lib/labels'
import { updateWorkOrder, saveCosts } from '../actions'

const ESTADOS = ['pendiente', 'programado', 'en_ejecucion', 'pausado', 'terminado', 'cancelado']

export default async function TrabajoDetalle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  const { supabase } = await requireModule('trabajos')
  const { data: w } = await supabase.from('work_orders').select('*').eq('id', id).single()
  if (!w) notFound()
  const [cl, { data: crews }] = await Promise.all([
    clientesPorId(supabase, [w.client_id]),
    supabase.from('crews').select('id,name').eq('active', true).order('name'),
  ])
  const costo = Number(w.cost_materials) + Number(w.cost_labor) + Number(w.cost_transport) + Number(w.cost_other)
  const utilidad = Number(w.sale_total) - costo

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold text-navy">
          Trabajo {String(w.seq).padStart(3, '0')} <span className="badge align-middle ml-2">{estado(w.status)}</span>
        </h1>
        <div className="flex gap-2">
          <Link href="/trabajos" className="btn btn-g">Volver</Link>
          {w.quote_id && <Link href={`/cotizaciones/${w.quote_id}`} className="btn btn-o">Ver cotización</Link>}
        </div>
      </div>
      {error && <div className="err">{error}</div>}
      <div className="card">
        <p><b>{nombre(cl.get(w.client_id))}</b></p>
        <p className="text-sm text-slate-500">Venta {cop(Number(w.sale_total))} · Costos {cop(costo)} · Utilidad {cop(utilidad)}</p>
      </div>

      <form action={updateWorkOrder} className="card">
        <input type="hidden" name="id" value={w.id} />
        <div className="grid-f">
          <div>
            <label className="lbl">Estado</label>
            <select name="status" className="inp" defaultValue={w.status}>
              {ESTADOS.map((e) => <option key={e} value={e}>{estado(e)}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Cuadrilla</label>
            <select name="crew_id" className="inp" defaultValue={w.crew_id ?? ''}>
              <option value="">Sin asignar</option>
              {(crews ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="lbl">Inicio</label><input type="date" name="start_date" className="inp" defaultValue={w.start_date ?? ''} /></div>
          <div><label className="lbl">Fin</label><input type="date" name="end_date" className="inp" defaultValue={w.end_date ?? ''} /></div>
        </div>
        <button type="submit" className="btn">Guardar</button>
      </form>

      <form action={saveCosts} className="card">
        <input type="hidden" name="id" value={w.id} />
        <div className="grid-f">
          <div><label className="lbl">Materiales</label><input type="number" min="0" step="any" name="cost_materials" className="inp" defaultValue={Number(w.cost_materials)} /></div>
          <div><label className="lbl">Mano de obra</label><input type="number" min="0" step="any" name="cost_labor" className="inp" defaultValue={Number(w.cost_labor)} /></div>
          <div><label className="lbl">Transporte</label><input type="number" min="0" step="any" name="cost_transport" className="inp" defaultValue={Number(w.cost_transport)} /></div>
          <div><label className="lbl">Otros</label><input type="number" min="0" step="any" name="cost_other" className="inp" defaultValue={Number(w.cost_other)} /></div>
        </div>
        <button type="submit" className="btn btn-g">Guardar costos</button>
      </form>
    </>
  )
}