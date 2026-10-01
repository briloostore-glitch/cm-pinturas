import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { cop } from '@/lib/format'

export default async function Inventario({ searchParams }: { searchParams: Promise<{ q?: string; bajo?: string }> }) {
  const { q, bajo } = await searchParams
  const { supabase } = await requireModule('inventario')
  let query = supabase.from('materials')
    .select('id,name,category,brand,unit,stock,min_stock,cost_price,active,supplier_id')
    .order('name').limit(500)
  if (q) query = query.ilike('name', `%${q}%`)
  const [{ data }, { data: provs }] = await Promise.all([query, supabase.from('suppliers').select('id,company')])
  const sup = new Map((provs ?? []).map((s) => [s.id as string, s.company as string]))
  const todos = data ?? []
  const bajos = todos.filter((m) => m.active && Number(m.stock) <= Number(m.min_stock))
  const rows = bajo === '1' ? bajos : todos

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-navy">Inventario</h1>
        <Link href="/inventario/nuevo" className="btn btn-o">Nuevo material</Link>
      </div>
      <p className="text-sm text-slate-500 mb-3">{todos.length} materiales · {bajos.length} con stock bajo</p>
      <form className="flex flex-wrap items-center gap-2 mb-3">
        <input name="q" defaultValue={q ?? ''} placeholder="Buscar material" className="inp" style={{ maxWidth: 260 }} />
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="bajo" value="1" defaultChecked={bajo === '1'} /> Solo stock bajo</label>
        <button type="submit" className="btn btn-g">Filtrar</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Material</th><th>Categoría</th><th>Proveedor</th><th>Stock</th><th>Mínimo</th><th>Costo</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {rows.map((m) => {
              const low = m.active && Number(m.stock) <= Number(m.min_stock)
              return (
                <tr key={m.id}>
                  <td>{m.name}{m.brand ? <span className="text-slate-500"> · {m.brand}</span> : null}</td>
                  <td>{m.category ?? '-'}</td>
                  <td>{m.supplier_id ? sup.get(m.supplier_id) ?? '-' : '-'}</td>
                  <td>{Number(m.stock)} {m.unit ?? ''}</td>
                  <td>{Number(m.min_stock)}</td>
                  <td>{cop(Number(m.cost_price ?? 0))}</td>
                  <td>{!m.active ? <span className="badge">Inactivo</span> : low ? <span className="badge badge-rechazada">Stock bajo</span> : <span className="badge badge-aprobada">Normal</span>}</td>
                  <td><Link href={`/inventario/${m.id}`} className="btn btn-g">Abrir</Link></td>
                </tr>
              )
            })}
            {!rows.length && <tr><td colSpan={8} className="text-slate-500">No hay materiales.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}