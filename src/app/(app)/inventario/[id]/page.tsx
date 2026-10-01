import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { fdate } from '@/lib/format'
import { clientesPorId, nombre } from '@/lib/labels'
import MaterialFields from '@/components/MaterialFields'
import { updateMaterial, addMovement } from '../actions'

export default async function MaterialDetalle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  const { supabase } = await requireModule('inventario')
  const [{ data: m }, { data: provs }, { data: movs }, { data: ots }] = await Promise.all([
    supabase.from('materials').select('*').eq('id', id).single(),
    supabase.from('suppliers').select('id,company').order('company'),
    supabase.from('inventory_movements').select('id,kind,qty,note,created_at').eq('material_id', id).order('created_at', { ascending: false }).limit(30),
    supabase.from('work_orders').select('id,seq,client_id,status').in('status', ['pendiente', 'programado', 'en_ejecucion', 'pausado']).order('seq', { ascending: false }).limit(50),
  ])
  if (!m) notFound()
  const cl = await clientesPorId(supabase, (ots ?? []).map((o) => o.client_id))
  const low = m.active && Number(m.stock) <= Number(m.min_stock)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold text-navy">
          {m.name} {low && <span className="badge badge-rechazada align-middle ml-2">Stock bajo</span>}
        </h1>
        <Link href="/inventario" className="btn btn-g">Volver</Link>
      </div>
      {error && <div className="err">{error}</div>}
      <div className="card">
        <p className="text-lg"><b>{Number(m.stock)} {m.unit ?? ''}</b> en stock <span className="text-sm text-slate-500">(mínimo {Number(m.min_stock)})</span></p>
      </div>

      <form action={addMovement} className="card">
        <input type="hidden" name="material_id" value={m.id} />
        <div className="grid-f">
          <div>
            <label className="lbl">Tipo de movimiento</label>
            <select name="kind" className="inp" defaultValue="entrada">
              <option value="entrada">Entrada (suma)</option>
              <option value="salida">Salida (resta)</option>
              <option value="ajuste">Ajuste (usa + o -)</option>
            </select>
          </div>
          <div><label className="lbl">Cantidad</label><input type="number" step="any" name="qty" className="inp" required /></div>
          <div>
            <label className="lbl">Trabajo (opcional)</label>
            <select name="work_order_id" className="inp" defaultValue="">
              <option value="">Sin trabajo</option>
              {(ots ?? []).map((o) => <option key={o.id} value={o.id}>{String(o.seq).padStart(3, '0')} - {nombre(cl.get(o.client_id))}</option>)}
            </select>
          </div>
          <div><label className="lbl">Nota</label><input name="note" className="inp" /></div>
        </div>
        <button type="submit" className="btn">Registrar movimiento</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Nota</th></tr></thead>
          <tbody>
            {(movs ?? []).map((x) => (
              <tr key={x.id}>
                <td>{fdate(x.created_at)}</td><td>{x.kind}</td>
                <td>{Number(x.qty) > 0 ? '+' : ''}{Number(x.qty)}</td><td>{x.note ?? ''}</td>
              </tr>
            ))}
            {!(movs ?? []).length && <tr><td colSpan={4} className="text-slate-500">Sin movimientos.</td></tr>}
          </tbody>
        </table>
      </div>

      <form action={updateMaterial} className="card">
        <input type="hidden" name="id" value={m.id} />
        <MaterialFields m={m} suppliers={provs ?? []} imagenUrl={m.image_path ? supabase.storage.from('materiales').getPublicUrl(m.image_path).data.publicUrl : null} />
        <button type="submit" className="btn btn-g">Guardar datos del material</button>
      </form>
    </>
  )
}