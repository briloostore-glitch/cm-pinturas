import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { cop, fdate } from '@/lib/format'
import { approveQuote, deleteQuote, rejectQuote } from '../actions'
import ConfirmSubmit from '@/components/ConfirmSubmit'

type Q = {
  id: string; seq: number; status: string; mode: number; city: string; area_m2: number; zone_percent: number
  transport: number; other_costs: number; margin_percent: number; tax_percent: number
  subtotal: number; tax: number; visit_credit: number; total: number; created_at: string
  clients: { first_name: string; last_name: string | null; phone: string | null } | null
}

export default async function CotizacionDetalle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  const { supabase, profile } = await requireModule('cotizaciones')
  const { data: rol } = await supabase.rpc('app_role')
  const esAdmin = rol === 'administrador' || (profile as unknown as { role?: string }).role === 'administrador'
  const { data } = await supabase.from('quotes').select('*, clients(first_name,last_name,phone)').eq('id', id).single()
  if (!data) notFound()
  const q = data as unknown as Q
  const { data: items } = await supabase.from('quote_items').select('*').eq('quote_id', id)
  const margin = Math.round((q.subtotal - (q.subtotal / (1 + q.margin_percent / 100))))

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold text-navy">
          Cotización {String(q.seq).padStart(3, '0')} <span className={`badge badge-${q.status} align-middle ml-2`}>{q.status}</span>
        </h1>
        <div className="flex gap-2">
          <Link href="/cotizaciones" className="btn btn-g">Volver</Link>
          {esAdmin && (
            <form action={deleteQuote}>
              <input type="hidden" name="id" value={q.id} />
              <input type="hidden" name="from" value="detalle" />
              <ConfirmSubmit label="Eliminar" message="&iquest;Eliminar esta cotizaci&oacute;n? No se puede deshacer." />
            </form>
          )}
          <Link href={`/cotizaciones/${q.id}/imprimir`} className="btn btn-o">Ver hoja para imprimir</Link>
        </div>
      </div>
      {error && <div className="err">{error}</div>}
      <div className="card">
        <p><b>{q.clients?.first_name} {q.clients?.last_name}</b> · {q.clients?.phone} · {fdate(q.created_at)}</p>
        <p className="text-sm text-slate-500">{q.area_m2} m² · Zona {q.city} (mano de obra al {q.zone_percent}%) · {q.mode === 1 ? 'Mano de obra + materiales' : 'Solo mano de obra'}</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Servicio</th><th>m²</th><th>M.O. por m²</th><th>Materiales por m²</th><th>Total</th></tr></thead>
          <tbody>
            {(items ?? []).map((i) => (
              <tr key={i.id}>
                <td>{i.description}</td><td>{i.qty}</td><td>{cop(Number(i.labor_unit))}</td><td>{cop(Number(i.material_unit))}</td><td>{cop(Number(i.total))}</td>
              </tr>
            ))}
            <tr><td>Transporte ({q.city})</td><td></td><td></td><td></td><td>{cop(Number(q.transport))}</td></tr>
            {Number(q.other_costs) > 0 && <tr><td>Otros costos</td><td></td><td></td><td></td><td>{cop(Number(q.other_costs))}</td></tr>}
            <tr><td>Utilidad ({q.margin_percent}%)</td><td></td><td></td><td></td><td>{cop(margin)}</td></tr>
            {Number(q.tax) > 0 && <tr><td>IVA ({q.tax_percent}%)</td><td></td><td></td><td></td><td>{cop(Number(q.tax))}</td></tr>}
            {Number(q.visit_credit) > 0 && <tr><td>Visita técnica pagada (descuento)</td><td></td><td></td><td></td><td>− {cop(Number(q.visit_credit))}</td></tr>}
            <tr><td colSpan={4} className="font-bold">TOTAL</td><td className="font-bold">{cop(Number(q.total))}</td></tr>
          </tbody>
        </table>
      </div>
      {q.status === 'pendiente' && (
        <div className="flex gap-2">
          <form action={approveQuote}><input type="hidden" name="id" value={q.id} /><ConfirmSubmit label="Aprobar cotización" message="¿Marcar esta cotización como aprobada?" className="btn" /></form>
          <form action={rejectQuote}><input type="hidden" name="id" value={q.id} /><ConfirmSubmit label="Rechazar" message="¿Marcar esta cotización como rechazada?" /></form>
        </div>
      )}
    </>
  )
}