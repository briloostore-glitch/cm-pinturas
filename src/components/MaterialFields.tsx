type M = {
  name?: string; category?: string | null; brand?: string | null; unit?: string | null
  cost_price?: number | null; suggested_price?: number | null; min_stock?: number | null
  supplier_id?: string | null; active?: boolean
}

export default function MaterialFields({ m, suppliers, nuevo }: { m?: M; suppliers: { id: string; company: string }[]; nuevo?: boolean }) {
  return (
    <>
      <div className="grid-f">
        <div><label className="lbl">Nombre</label><input name="name" className="inp" defaultValue={m?.name ?? ''} required /></div>
        <div><label className="lbl">Categoría</label><input name="category" className="inp" defaultValue={m?.category ?? ''} /></div>
        <div><label className="lbl">Marca</label><input name="brand" className="inp" defaultValue={m?.brand ?? ''} /></div>
        <div><label className="lbl">Unidad (galón, kg, und)</label><input name="unit" className="inp" defaultValue={m?.unit ?? ''} /></div>
        <div><label className="lbl">Precio de costo</label><input type="number" min="0" step="any" name="cost_price" className="inp" defaultValue={Number(m?.cost_price ?? 0)} /></div>
        <div><label className="lbl">Precio sugerido</label><input type="number" min="0" step="any" name="suggested_price" className="inp" defaultValue={Number(m?.suggested_price ?? 0)} /></div>
        <div><label className="lbl">Stock mínimo</label><input type="number" min="0" step="any" name="min_stock" className="inp" defaultValue={Number(m?.min_stock ?? 0)} /></div>
        <div>
          <label className="lbl">Proveedor</label>
          <select name="supplier_id" className="inp" defaultValue={m?.supplier_id ?? ''}>
            <option value="">Sin proveedor</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.company}</option>)}
          </select>
        </div>
        {nuevo
          ? <div><label className="lbl">Stock inicial (opcional)</label><input type="number" min="0" step="any" name="initial_stock" className="inp" defaultValue={0} /></div>
          : <div><label className="lbl">Activo</label><label className="flex items-center gap-2 py-2"><input type="checkbox" name="active" defaultChecked={m?.active ?? true} /> Disponible para usar</label></div>}
      </div>
    </>
  )
}