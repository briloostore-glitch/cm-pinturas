import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { createQuote } from '../actions'
import FormularioCotizacion from '@/components/FormularioCotizacion'

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
  const exactos = svcSol ? (services ?? []).filter((sv) => norm(sv.name) === svcSol) : []
  const parecidos = svcSol && !exactos.length
    ? (services ?? []).filter((sv) => { const n = norm(sv.name); return svcSol.includes(n) || n.includes(svcSol) })
    : []
  const marcados = (exactos.length ? exactos : parecidos).map((sv) => String(sv.id))

  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Nueva cotizaci&oacute;n</h1>
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
          {!marcados.length && sol.servicio && <p className="text-sm text-red-600">Marca el servicio a mano: pidi&oacute; &quot;{sol.servicio}&quot;.</p>}
        </div>
      )}
      {!lista.length ? (
        <div className="card">Primero registra un cliente en <Link href="/clientes" className="underline text-navy">Clientes</Link>.</div>
      ) : (
        <FormularioCotizacion
          key={solicitud ?? 'nueva'}
          action={createQuote}
          solicitudId={sol?.id}
          clientes={lista.map((c) => ({
            id: String(c.id),
            label: String(c.first_name ?? '') + ' ' + String(c.last_name ?? '') + (c.phone ? ' - ' + c.phone : ''),
          }))}
          servicios={(services ?? []).map((s) => ({ id: String(s.id), name: String(s.name) }))}
          zonas={(zones ?? []).map((z) => String(z.name))}
          inicial={{
            clienteId: cliente ? String(cliente.id) : undefined,
            tipo: sol ? tipoDe(sol.tipo_inmueble) : undefined,
            zona,
            direccion: sol?.direccion ?? undefined,
            humedad: !!sol?.humedad,
            areaInformada: sol?.area_m2 ?? undefined,
            marcados,
          }}
        />
      )}
    </>
  )
}