import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { fdate } from '@/lib/format'
import { convertRequest, discardRequest, deleteRequest } from './actions'
import DeleteButton from './DeleteButton'
import SolicitudesAlert from './SolicitudesAlert'

type Req = {
  id: string; created_at: string; status: string; tipo_inmueble: string | null; tipo_otro: string | null
  area_m2: number | null; servicio: string | null; humedad: boolean | null; ciudad: string | null
  ciudad_otra: string | null; direccion: string | null; visita_diagnostico: boolean | null
  nombre: string | null; celular: string | null; correo: string | null; mensaje: string | null
  fotos: string[] | null
}

const ESTADO: Record<string, string> = { nueva: 'Nueva', convertida: 'Convertida', descartada: 'Descartada' }

export default async function Solicitudes({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireModule('solicitudes')
  const sp = await searchParams
  const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false }).limit(200)
  const rows = (data ?? []) as Req[]
  const ultima = rows.filter((r) => r.status === 'nueva').map((r) => r.created_at).sort().pop() ?? ''

  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Solicitudes web</h1>
      <SolicitudesAlert ultima={ultima} />
      {sp.error && <div className="card mb-4 text-red-600">{sp.error}</div>}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-center justify-between">
              <strong>{r.nombre ?? 'Sin nombre'}</strong>
              <span className="badge">{ESTADO[r.status] ?? r.status}</span>
            </div>
            <p className="text-sm text-slate-500">{fdate(r.created_at)} | {r.celular ?? '-'} | {r.correo ?? '-'}</p>
            <p className="mt-2">
              {r.servicio ?? '-'} | {r.tipo_inmueble === 'Otro' ? r.tipo_otro : r.tipo_inmueble ?? '-'}
              {r.area_m2 != null ? ' | ' + r.area_m2 + ' m2' : ''}{r.humedad ? ' | con humedad' : ''}
            </p>
            <p>{r.ciudad === 'Otra' ? r.ciudad_otra : r.ciudad} | {r.direccion ?? '-'}</p>
            {r.visita_diagnostico && <p className="font-semibold">Pidio visita tecnica</p>}
            {r.mensaje && <p className="text-sm mt-1">{r.mensaje}</p>}
            {!!r.fotos?.length && (
              <p className="text-sm mt-1">
                {r.fotos.map((u, i) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer" className="mr-3 underline">Foto {i + 1}</a>
                ))}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              {r.status !== 'descartada' && (
                <Link href={`/cotizaciones/nueva?solicitud=${r.id}`} className="btn btn-o">Cotizar</Link>
              )}
              {r.status === 'nueva' && (<>
                <form action={convertRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="btn btn-o">Crear cliente{r.visita_diagnostico ? ' y visita' : ''}</button>
                </form>
                <form action={discardRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="btn btn-g">Descartar</button>
                </form></>)}
                <form action={deleteRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <DeleteButton />
                </form>
            </div>
          </div>
        ))}
        {!rows.length && <p className="text-slate-500">Aun no hay solicitudes.</p>}
      </div>
    </>
  )
}