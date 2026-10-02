import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { cop } from '@/lib/money'
import { listarObras } from '@/lib/avances'
import { createContract } from './actions'

type Fila = {
  id: string; seq: number; employee_id: string; work_order_id: string | null; object: string
  daily_rate: number; start_date: string; end_date: string | null; status: string
}

const ESTADO: Record<string, string> = { borrador: 'Borrador', firmado: 'En firme', anulado: 'Anulado' }

export default async function Contratos({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await requireModule('contratos')

  const { data: emps } = await supabase.from('employees').select('id,full_name,status').order('full_name')
  const { data: filas } = await supabase.from('work_contracts')
    .select('id,seq,employee_id,work_order_id,object,daily_rate,start_date,end_date,status')
    .order('created_at', { ascending: false }).limit(200)
  const { obras } = await listarObras(supabase)

  const nombres = new Map((emps ?? []).map((e) => [e.id as string, e.full_name as string]))
  const activos = (emps ?? []).filter((e) => e.status !== 'inactivo')
  const rows = (filas ?? []) as Fila[]

  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Contratos por obra</h1>
      {error && <div className="err">{error}</div>}

      <form action={createContract} className="card">
        <h2 className="font-bold text-navy mb-2">Nuevo contrato</h2>
        <div className="grid-f">
          <div>
            <label className="lbl">Trabajador *</label>
            <select name="employee_id" required defaultValue="" className="inp">
              <option value="" disabled>Elige...</option>
              {activos.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Obra</label>
            <select name="work_order_id" defaultValue="" className="inp">
              <option value="">Sin obra asignada</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {'Obra ' + String(o.seq).padStart(3, '0') + ' - ' + (o.cliente || 'Sin cliente') + ' (' + o.status.replace(/_/g, ' ') + ')'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="lbl">Valor por d&iacute;a (COP) *</label>
            <input name="daily_rate" type="number" min="1" step="1" required placeholder="60000" className="inp" />
          </div>
          <div>
            <label className="lbl">Fecha de inicio *</label>
            <input name="start_date" type="date" required className="inp" />
          </div>
          <div>
            <label className="lbl">Fecha final (opcional)</label>
            <input name="end_date" type="date" className="inp" />
          </div>
        </div>
        <label className="lbl">Trabajo a realizar *</label>
        <textarea name="object" rows={3} required className="inp mb-3" placeholder="Ej: pintar apartamento de 80 m2: estuco, base y dos manos de pintura" />
        <label className="lbl">Condiciones adicionales (opcional)</label>
        <textarea name="notes" rows={2} className="inp mb-3" />
        <button type="submit" className="btn">Crear contrato</button>
      </form>

      <div className="space-y-3">
        {rows.map((r) => (
          <Link key={r.id} href={'/contratos/' + r.id} className="card block hover:shadow-md" style={{ marginBottom: 0 }}>
            <div className="flex items-center justify-between">
              <b>Contrato {String(r.seq).padStart(3, '0')} &middot; {nombres.get(r.employee_id) ?? 'Trabajador'}</b>
              <span className="badge">{ESTADO[r.status] ?? r.status}</span>
            </div>
            <p className="text-sm">{cop(Number(r.daily_rate))} por d&iacute;a &middot; desde {r.start_date}{r.end_date ? ' hasta ' + r.end_date : ''}</p>
            <p className="text-sm text-slate-500 whitespace-pre-line">{r.object}</p>
          </Link>
        ))}
        {!rows.length && <p className="text-slate-500">A&uacute;n no hay contratos.</p>}
      </div>
    </>
  )
}