import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { createQuote } from '../actions'

export default async function NuevaCotizacion({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await requireModule('cotizaciones')
  const [{ data: clients }, { data: services }, { data: zones }] = await Promise.all([
    supabase.from('clients').select('id,first_name,last_name,phone').order('first_name'),
    supabase.from('services').select('id,name').eq('active', true).order('name'),
    supabase.from('zones').select('name').order('name'),
  ])

  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Nueva cotización</h1>
      {error && <div className="err">{error}</div>}
      {!(clients ?? []).length ? (
        <div className="card">Primero registra un cliente en <Link href="/clientes" className="underline text-navy">Clientes</Link>.</div>
      ) : (
        <form action={createQuote} className="card">
          <div className="grid-f">
            <div>
              <label className="lbl">Cliente *</label>
              <select name="client_id" required className="inp">
                {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.phone ? `· ${c.phone}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Tipo de inmueble</label>
              <select name="kind" className="inp">
                <option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="local">Local comercial</option>
                <option value="oficina">Oficina</option><option value="otro">Otro</option>
              </select>
            </div>
            <div><label className="lbl">Área (m²) *</label><input name="area_m2" type="number" min="1" step="0.01" required className="inp" /></div>
            <div>
              <label className="lbl">Zona *</label>
              <select name="city" className="inp">{(zones ?? []).map((z) => <option key={z.name}>{z.name}</option>)}</select>
            </div>
            <div><label className="lbl">Dirección de la obra</label><input name="address" className="inp" /></div>
          </div>
          <label className="lbl">Servicios *</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(services ?? []).map((s) => (
              <label key={s.id} className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                <input type="checkbox" name="services" value={s.id} /> {s.name}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="mode" value="1" defaultChecked /> Mano de obra + materiales</label>
            <label className="flex items-center gap-2"><input type="radio" name="mode" value="2" /> Solo mano de obra (materiales del cliente)</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="has_humidity" /> Tiene humedad</label>
          </div>
          <button className="btn btn-o">Calcular y crear cotización</button>
          <p className="text-xs text-slate-500 mt-2">El precio se calcula en el servidor con las tarifas de Precios, el ajuste de la zona, el transporte y el margen.</p>
        </form>
      )}
    </>
  )
}