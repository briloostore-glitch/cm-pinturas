import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { firmarFotos, hora, listarObras } from '@/lib/avances'
import PhotosInput from '@/components/PhotosInput'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import { addProgress, deleteProgress } from '../actions'

type Avance = { id: string; author_id: string | null; progress_percent: number; note: string | null; photo_paths: string[] | null; created_at: string }

export default async function AvanceDetalle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  const { supabase, profile } = await requireModule('avances')
  const rol = String((profile as unknown as { role?: string }).role ?? '')
  const puedeRegistrar = rol !== 'contabilidad'
  const puedeBorrar = rol === 'administrador' || rol === 'supervisor'

  const { obras, error: eObras } = await listarObras(supabase)
  const obra = obras.find((o) => o.id === id)
  if (!obra) {
    if (eObras) return <div className="err">{eObras}</div>
    notFound()
  }

  const { data: filas } = await supabase.from('work_progress')
    .select('id,author_id,progress_percent,note,photo_paths,created_at')
    .eq('work_order_id', id).order('created_at', { ascending: false }).limit(50)
  const avances = (filas ?? []) as Avance[]
  const autores = Array.from(new Set(avances.map((a) => a.author_id).filter((x): x is string => !!x)))
  const perfiles = autores.length ? (await supabase.from('profiles').select('id,full_name,email').in('id', autores)).data ?? [] : []
  const nombres = new Map(perfiles.map((p) => [p.id as string, (p.full_name ?? p.email) as string]))
  const firmas = await firmarFotos(supabase, avances.flatMap((a) => a.photo_paths ?? []))

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="text-2xl font-bold text-navy">Obra {String(obra.seq).padStart(3, '0')}</h1>
        <Link href="/avances" className="btn btn-g">Volver</Link>
      </div>
      <p className="text-sm mb-1">{obra.cliente || 'Sin cliente'} · <span className="badge">{obra.status.replace(/_/g, ' ')}</span></p>
      {obra.direccion && <p className="text-xs text-slate-500 mb-3">{obra.direccion}</p>}
      {error && <div className="err">{error}</div>}

      {puedeRegistrar && (
        <form action={addProgress} className="card">
          <input type="hidden" name="work_order_id" value={obra.id} />
          <h2 className="font-bold text-navy mb-2">Registrar avance</h2>
          <div className="grid-f">
            <div>
              <label className="lbl">Avance total de la obra (%)</label>
              <input type="number" name="progress_percent" min="0" max="100" step="1" defaultValue={obra.ultimo_avance ?? 0} className="inp" required />
            </div>
          </div>
          <label className="lbl">Qué se hizo</label>
          <textarea name="note" rows={3} className="inp mb-3" placeholder="Ej: se aplicó la segunda mano en sala y pasillo" />
          <PhotosInput />
          <button type="submit" className="btn">Registrar avance</button>
        </form>
      )}

      <h2 className="font-bold text-navy mb-2">Historial</h2>
      <div className="space-y-3">
        {avances.map((a) => (
          <div key={a.id} className="card" style={{ marginBottom: 0 }}>
            <div className="flex items-center justify-between text-sm">
              <span><b>{a.progress_percent}%</b> · {hora(a.created_at)}</span>
              <span className="text-slate-500">{a.author_id ? nombres.get(a.author_id) ?? 'Usuario' : '-'}</span>
            </div>
            <div className="h-2 rounded bg-slate-100 my-2"><div className="h-2 rounded bg-accent" style={{ width: `${a.progress_percent}%` }} /></div>
            {a.note && <p className="text-sm whitespace-pre-line">{a.note}</p>}
            {(a.photo_paths ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(a.photo_paths ?? []).map((p) => {
                  const u = firmas.get(p)
                  return u ? (
                    <a key={p} href={u} target="_blank" rel="noopener noreferrer">
                      <img src={u} alt="Foto del avance" className="w-24 h-24 rounded-lg object-cover border" />
                    </a>
                  ) : null
                })}
              </div>
            )}
            {puedeBorrar && (
              <form action={deleteProgress} className="mt-2">
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="work_order_id" value={obra.id} />
                <ConfirmSubmit label="Eliminar avance" message="¿Eliminar este avance y sus fotos?" />
              </form>
            )}
          </div>
        ))}
        {!avances.length && <p className="text-sm text-slate-500">Todavía no hay avances registrados.</p>}
      </div>
    </>
  )
}