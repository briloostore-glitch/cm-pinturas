import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { cop, fdate } from '@/lib/format'
import { clientesPorId, nombre, estado } from '@/lib/labels'
import { payVisit, scheduleVisit, setVisitStatus } from '../actions'

const ESTADOS = ['solicitud_recibida', 'pago_pendiente', 'pago_recibido', 'pendiente_agendamiento', 'visita_agendada', 'visita_confirmada', 'visita_realizada', 'cotizacion_generada', 'descontada_de_cotizacion', 'servicio_no_contratado', 'cancelada']
const METODOS = ['efectivo', 'transferencia', 'nequi', 'daviplata', 'tarjeta', 'otro']

export default async function VisitaDetalle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  const { supabase } = await requireModule('visitas')
  const { data: v } = await supabase.from('visits').select('*').eq('id', id).single()
  if (!v) notFound()
  const cl = await clientesPorId(supabase, [v.client_id])
  const c = cl.get(v.client_id)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold text-navy">
          Visita {String(v.seq).padStart(3, '0')} <span className="badge align-middle ml-2">{estado(v.status)}</span>
        </h1>
        <div className="flex gap-2">
          <Link href="/visitas" className="btn btn-g">Volver</Link>
          <Link href="/cotizaciones/nueva" className="btn btn-o">Crear cotización</Link>
        </div>
      </div>
      {error && <div className="err">{error}</div>}
      <div className="card">
        <p><b>{nombre(c)}</b> · registrada el {fdate(v.created_at)}</p>
        <p className="text-sm text-slate-500">
          Valor {cop(Number(v.price))} · {v.paid_at ? `Pagada el ${fdate(v.paid_at)} (${v.payment_method ?? 'sin método'})` : 'Pago pendiente'}
          {v.scheduled_at ? ` · Agendada para ${fdate(v.scheduled_at)}` : ''}
        </p>
        {v.notes && <p className="text-sm mt-2">{v.notes}</p>}
      </div>

      {!v.paid_at && v.status !== 'cancelada' && (
        <form action={payVisit} className="card">
          <input type="hidden" name="id" value={v.id} />
          <label className="lbl">Registrar pago de la visita ({cop(Number(v.price))})</label>
          <div className="flex gap-2">
            <select name="method" className="inp" defaultValue="">
              <option value="" disabled>Método de pago</option>
              {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button type="submit" className="btn">Registrar pago</button>
          </div>
        </form>
      )}

      {v.paid_at && (
        <form action={scheduleVisit} className="card">
          <input type="hidden" name="id" value={v.id} />
          <label className="lbl">Agendar visita (hora de Colombia)</label>
          <div className="flex gap-2">
            <input type="datetime-local" name="scheduled_at" className="inp" />
            <button type="submit" className="btn">Agendar</button>
          </div>
        </form>
      )}

      <form action={setVisitStatus} className="card">
        <input type="hidden" name="id" value={v.id} />
        <label className="lbl">Cambiar estado</label>
        <div className="flex gap-2">
          <select name="status" className="inp" defaultValue={v.status}>
            {ESTADOS.map((e) => <option key={e} value={e}>{estado(e)}</option>)}
          </select>
          <button type="submit" className="btn btn-g">Guardar estado</button>
        </div>
      </form>
    </>
  )
}