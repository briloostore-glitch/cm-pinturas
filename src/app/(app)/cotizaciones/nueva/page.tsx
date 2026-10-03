import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { createQuote } from '../actions'

type Sol = {
  id: string; client_id: string | null; nombre: string | null; celular: string | null; correo: string | null
  tipo_inmueble: string | null; tipo_otro: string | null; area_m2: number | null; servicio: string | null
  humedad: boolean | null; ciudad: string | null; ciudad_otra: string | null; direccion: string | null
  mensaje: string | null; fotos: string[] | null
}

const norm = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const dig = (s: unknown) => String(s ?? '').replace(/\D/g, '').slice(-10)

function tipoDe(s: string | null): string {
  const n = norm(s)
  if (n.includes('apart')) return 'apartamento'
  if (n.includes('local')) return 'local'
  if (n.includes('oficina')) return 'oficina'
  if (n.includes('casa')) return 'casa'
  return n ? 'otro' : 'casa'
}
export default async function NuevaCotizacion({ searchParams }: { searchParams: Promise<{ error?: string; solicitud?: string }> }) {
  const { error, solicitud } = await searchParams
  const { supabase } = await requireModule('cotizaciones')
  const [{ data: clients }, { data: services }, { data: zones }] = await Promise.all([
    supabase.from('clients').select('id,first_name,last_name,phone,whatsapp,email').order('first_name'),
    supabase.from('services').select('id,name').eq('active', true).order('name'),
    supabase.from('zones').select('name').order('name'),
  ])

  const sol: Sol | null = solicitud
    ? (((await supabase.from('requests').select('*').eq('id', solicitud).single()).data as Sol | null) ?? null)
    : null
  const lista = clients ?? []
  const cliente = sol
    ? (lista.find((c) => !!sol.client_id && c.id === sol.client_id) ??
       lista.find((c) => dig(sol.celular).length >= 7 && (dig(c.phone) === dig(sol.celular) || dig(c.whatsapp) === dig(sol.celular))) ??
       lista.find((c) => norm(sol.correo) !== '' && norm(c.email) === norm(sol.correo)))
    : undefined
  const ciudadSol = sol ? (sol.ciudad === 'Otra' ? sol.ciudad_otra : sol.ciudad) : null
  const zona = (zones ?? []).find((z) => norm(z.name) === norm(ciudadSol))?.name as string | undefined
  const svcSol = norm(sol?.servicio)
  const marcados = new Set<string>(
    svcSol
      ? (services ?? []).filter((sv) => { const n = norm(sv.name); return n === svcSol || svcSol.includes(n) || n.includes(svcSol) }).map((sv) => String(sv.id))
      : []
  )
  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Nueva cotización</h1>
      {error && <div className="err">{error}</div>}
      {sol && (
        <div className="card" style={{ borderLeft: '4px solid #1e3a8a' }}>
          <p className="font-bold">Datos de la solicitud web (ya cargados abajo, rev&iacute;salos)</p>
          <p>{sol.nombre} | {sol.celular} | {sol.correo}</p>
          <p className="text-sm">
            Pidi&oacute;: {sol.servicio ?? '-'} | {sol.tipo_inmueble === 'Otro' ? sol.tipo_otro : sol.tipo_inmueble}
            {sol.area_m2 != null ? ' | ' + sol.area_m2 + ' m2' : ''}{sol.humedad ? ' | con humedad' : ''}
          </p>
          <p className="text-sm">{ciudadSol ?? '-'} | {sol.direccion ?? '-'}</p>
          {sol.mensaje && <p className="text-sm">{sol.mensaje}</p>}
          {!!sol.fotos?.length && (
            <p className="text-sm">
              {sol.fotos.map((u, i) => (
                <a key={u} href={u} target="_blank" rel="noreferrer" className="mr-3 underline">Foto {i + 1}</a>
              ))}
            </p>
          )}
          {!cliente && (
            <p className="text-sm text-red-600 mt-1">
              Este cliente a&uacute;n no est&aacute; registrado. Cr&eacute;alo con &quot;Crear cliente y visita&quot; en <Link href="/solicitudes" className="underline">Solicitudes</Link> o en <Link href="/clientes" className="underline">Clientes</Link>, y vuelve a pulsar Cotizar.
            </p>
          )}
          {!zona && ciudadSol && <p className="text-sm text-red-600">La ciudad &quot;{ciudadSol}&quot; no est&aacute; en tus zonas: elige la zona.</p>}
          {!marcados.size && sol.servicio && <p className="text-sm text-red-600">Marca el servicio a mano: pidi&oacute; &quot;{sol.servicio}&quot;.</p>}
        </div>
      )}
      {!(clients ?? []).length ? (
        <div className="card">Primero registra un cliente en <Link href="/clientes" className="underline text-navy">Clientes</Link>.</div>
      ) : (
        <form action={createQuote} className="card">
          {sol && <input type="hidden" name="solicitud" value={sol.id} />}
          <div className="grid-f">
            <div>
              <label className="lbl">Cliente *</label>
              <select name="client_id" required defaultValue={cliente?.id} className="inp">
                {sol && !cliente && <option value="">Elige el cliente...</option>}
                {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.phone ? `· ${c.phone}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Tipo de inmueble</label>
              <select name="kind" defaultValue={sol ? tipoDe(sol.tipo_inmueble) : undefined} className="inp">
                <option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="local">Local comercial</option>
                <option value="oficina">Oficina</option><option value="otro">Otro</option>
              </select>
            </div>
            <div><label className="lbl">Área (m²) *</label><input name="area_m2" type="number" min="1" step="0.01" required defaultValue={sol?.area_m2 ?? undefined} className="inp" /></div>
            <div>
              <label className="lbl">Zona *</label>
              <select name="city" defaultValue={zona} className="inp">{(zones ?? []).map((z) => <option key={z.name}>{z.name}</option>)}</select>
            </div>
            <div><label className="lbl">Dirección de la obra</label><input name="address" defaultValue={sol?.direccion ?? ''} className="inp" /></div>
          </div>
          <label className="lbl">Servicios *</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(services ?? []).map((s) => (
              <label key={s.id} className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                <input type="checkbox" name="services" value={s.id} defaultChecked={marcados.has(String(s.id))} /> {s.name}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="mode" value="1" defaultChecked /> Mano de obra + materiales</label>
            <label className="flex items-center gap-2"><input type="radio" name="mode" value="2" /> Solo mano de obra (materiales del cliente)</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="has_humidity" defaultChecked={!!sol?.humedad} /> Tiene humedad</label>
          </div>
          <button className="btn btn-o">Calcular y crear cotización</button>
          <p className="text-xs text-slate-500 mt-2">El precio se calcula en el servidor con las tarifas de Precios, el ajuste de la zona, el transporte y el margen.</p>
        </form>
      )}
    </>
  )
}