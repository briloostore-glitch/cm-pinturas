import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { ACTIVAS, hora, listarObras } from '@/lib/avances'

export default async function Avances({ searchParams }: { searchParams: Promise<{ todas?: string }> }) {
  const { todas } = await searchParams
  const { supabase, profile } = await requireModule('avances')
  const rol = String((profile as unknown as { role?: string }).role ?? '')
  const { obras, error } = await listarObras(supabase)
  const verTodas = todas === '1'
  const lista = verTodas ? obras : obras.filter((o) => ACTIVAS.includes(o.status))

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold text-navy">{rol === 'trabajador' ? 'Mis obras' : 'Avances de obra'}</h1>
        <Link href={verTodas ? '/avances' : '/avances?todas=1'} className="btn btn-g">{verTodas ? 'Solo activas' : 'Ver también terminadas'}</Link>
      </div>
      {error && <div className="err">{error}</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {lista.map((o) => (
          <Link key={o.id} href={`/avances/${o.id}`} className="card block hover:shadow-md" style={{ marginBottom: 0 }}>
            <div className="flex items-center justify-between">
              <b>Obra {String(o.seq).padStart(3, '0')}</b>
              <span className="badge">{o.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-sm">{o.cliente || 'Sin cliente'}</p>
            {o.direccion && <p className="text-xs text-slate-500">{o.direccion}</p>}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Avance {o.ultimo_avance ?? 0}%</span>
                <span>{o.ultima_fecha ? 'Último: ' + hora(o.ultima_fecha) : 'Sin avances'}</span>
              </div>
              <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-accent" style={{ width: `${o.ultimo_avance ?? 0}%` }} /></div>
            </div>
          </Link>
        ))}
      </div>
      {!lista.length && !error && (
        <p className="text-slate-500">
          {rol === 'trabajador'
            ? 'No tienes obras asignadas. Pide al administrador que te vincule a una cuadrilla y asigne la cuadrilla a la obra.'
            : 'No hay obras para mostrar.'}
        </p>
      )}
    </>
  )
}