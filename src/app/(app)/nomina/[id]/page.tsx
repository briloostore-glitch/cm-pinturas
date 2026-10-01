import Link from 'next/link'
import { notFound } from 'next/navigation'
import { guard } from '@/lib/guard'
import { ui } from '@/lib/ui'
import { cop, fdate, label, POSITIONS } from '@/lib/money'
import { addMissingEmployees, saveItem, setPaid, setPeriodStatus } from '../actions'

type Item = {
  id: string; days: number; base: number; bonus: number; advances: number; deductions: number; total: number; paid: boolean
  employees: { full_name: string; position: string; pay_type: string; daily_rate: number } | null
}

export default async function Periodo({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  const { supabase } = await guard('nomina')
  const { data: period } = await supabase.from('payroll_periods').select('*').eq('id', id).single()
  if (!period) notFound()
  const { data } = await supabase.from('payroll_items')
    .select('id,days,base,bonus,advances,deductions,total,paid,employees(full_name,position,pay_type,daily_rate)')
    .eq('period_id', id)
  const items = ((data ?? []) as unknown as Item[]).sort((a, b) => (a.employees?.full_name ?? '').localeCompare(b.employees?.full_name ?? ''))
  const open = period.status === 'abierta'
  const total = items.reduce((s, i) => s + Number(i.total), 0)
  const paid = items.filter((i) => i.paid).reduce((s, i) => s + Number(i.total), 0)
  const kpis: [string, string][] = [['Total del período', cop(total)], ['Pagado', cop(paid)], ['Pendiente', cop(total - paid)]]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className={ui.h1}>{period.name}</h1>
        <div className="flex gap-2">
          <Link href="/nomina" className={ui.btnG}>Volver</Link>
          <form action={setPeriodStatus}>
            <input type="hidden" name="period_id" value={id} />
            <input type="hidden" name="status" value={open ? 'cerrada' : 'abierta'} />
            <button className={ui.btnG}>{open ? 'Cerrar período' : 'Reabrir período'}</button>
          </form>
        </div>
      </div>
      <p className="text-slate-500 mb-4">{period.start_date ? fdate(period.start_date) : '—'} → {period.end_date ? fdate(period.end_date) : '—'} · {open ? 'Abierto' : 'Cerrado (solo lectura)'}</p>
      {error && <div className={ui.err}>{error}</div>}
      <div className="grid gap-3 grid-cols-3 mb-4">
        {kpis.map(([l, v]) => <div key={l} className={ui.kpi}><div className="text-xs text-slate-500">{l}</div><div className="text-lg font-bold">{v}</div></div>)}
      </div>

      <div className={ui.card + ' overflow-x-auto'}>
        {items.length ? (
          <table className={ui.table}>
            <thead><tr><th className={ui.th}>Trabajador</th><th className={ui.th}>Días</th><th className={ui.th}>Valor base</th><th className={ui.th}>Bonificaciones</th><th className={ui.th}>Anticipos</th><th className={ui.th}>Descuentos</th><th className={ui.th}>Total</th><th className={ui.th}>Estado</th><th className={ui.th}></th></tr></thead>
            <tbody>
              {items.map((i) => {
                const daily = i.employees?.pay_type === 'diario'
                const f = `f${i.id}`
                return (
                  <tr key={i.id}>
                    <td className={ui.td}>
                      <div className="font-medium">{i.employees?.full_name}</div>
                      <div className="text-xs text-slate-500">{label(POSITIONS, i.employees?.position ?? null)} · {daily ? `${cop(Number(i.employees?.daily_rate))}/día` : 'por trabajo'}</div>
                    </td>
                    <td className={ui.td}><input form={f} name="days" type="number" min="0" step="0.5" defaultValue={i.days} disabled={!open} className={ui.inp + ' w-20'} /></td>
                    <td className={ui.td}>
                      {daily ? cop(Number(i.base)) : <input form={f} name="base" type="number" min="0" defaultValue={i.base} disabled={!open} className={ui.inp + ' w-28'} />}
                    </td>
                    <td className={ui.td}><input form={f} name="bonus" type="number" min="0" defaultValue={i.bonus} disabled={!open} className={ui.inp + ' w-24'} /></td>
                    <td className={ui.td}><input form={f} name="advances" type="number" min="0" defaultValue={i.advances} disabled={!open} className={ui.inp + ' w-24'} /></td>
                    <td className={ui.td}><input form={f} name="deductions" type="number" min="0" defaultValue={i.deductions} disabled={!open} className={ui.inp + ' w-24'} /></td>
                    <td className={ui.td + ' font-semibold'}>{cop(Number(i.total))}</td>
                    <td className={ui.td}>{i.paid ? <span className="text-green-700">Pagada</span> : <span className="text-amber-700">Pendiente</span>}</td>
                    <td className={ui.td}>
                      <div className="flex gap-2">
                        <form id={f} action={saveItem}>
                          <input type="hidden" name="id" value={i.id} /><input type="hidden" name="period_id" value={id} />
                          {open && <button className={ui.btnG}>Guardar</button>}
                        </form>
                        <form action={setPaid}>
                          <input type="hidden" name="id" value={i.id} /><input type="hidden" name="period_id" value={id} />
                          <input type="hidden" name="paid" value={i.paid ? '0' : '1'} />
                          <button className={i.paid ? ui.btnG : ui.btn}>{i.paid ? 'Marcar pendiente' : 'Marcar pagada'}</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : <p className={ui.empty}>No hay trabajadores en este período. Registra personal activo y pulsa “Agregar trabajadores”.</p>}
      </div>
      {open && (
        <form action={addMissingEmployees}>
          <input type="hidden" name="period_id" value={id} />
          <button className={ui.btnG}>Agregar trabajadores activos que falten</button>
        </form>
      )}
      <p className="text-xs text-slate-500 mt-4">Para pago por día, el valor base es días × valor diario. Los valores son los que configures: el sistema no aplica prestaciones ni deducciones legales automáticamente.</p>
    </>
  )
}
