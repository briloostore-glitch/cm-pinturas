import { guard } from '@/lib/guard'
import { ui } from '@/lib/ui'
import { cop, fdate, label, today, METHODS } from '@/lib/money'
import ConfirmAction from '@/components/ConfirmAction'
import { createPayment, deletePayment } from './actions'

type Name = { first_name: string; last_name: string | null } | null
type Order = { id: string; seq: number; sale_total: number; clients: Name }
type Visit = { id: string; seq: number; price: number; status: string; clients: Name }
type Pay = {
  id: string; kind: string; method: string; amount: number; paid_at: string; notes: string | null
  clients: Name; work_orders: { seq: number } | null; visits: { seq: number } | null
}
const nm = (c: Name) => (c ? `${c.first_name} ${c.last_name ?? ''}`.trim() : '')
const KIND: [string, string][] = [['visita', 'Visita técnica'], ['anticipo', 'Anticipo'], ['abono', 'Abono'], ['pago_final', 'Pago final']]

export default async function Pagos({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase, profile } = await guard('facturacion')
  const [{ data: o }, { data: v }, { data: p }, { data: allPay }] = await Promise.all([
    supabase.from('work_orders').select('id,seq,sale_total,clients(first_name,last_name)').neq('status', 'cancelado').order('seq', { ascending: false }),
    supabase.from('visits').select('id,seq,price,status,clients(first_name,last_name)').is('paid_at', null).not('status', 'in', '(cancelada,servicio_no_contratado)').order('seq', { ascending: false }),
    supabase.from('payments').select('id,kind,method,amount,paid_at,notes,clients(first_name,last_name),work_orders(seq),visits(seq)').order('paid_at', { ascending: false }).order('id').limit(100),
    supabase.from('payments').select('work_order_id,amount,paid_at').limit(5000),
  ])
  const orders = (o ?? []) as unknown as Order[]
  const visits = (v ?? []) as unknown as Visit[]
  const pays = (p ?? []) as unknown as Pay[]

  const paidBy = new Map<string, number>()
  for (const x of allPay ?? []) if (x.work_order_id) paidBy.set(x.work_order_id, (paidBy.get(x.work_order_id) ?? 0) + Number(x.amount))
  const withBalance = orders.map((x) => ({ ...x, paid: paidBy.get(x.id) ?? 0, saldo: Number(x.sale_total) - (paidBy.get(x.id) ?? 0) })).filter((x) => x.saldo > 0)
  const month = today().slice(0, 7)
  const cobradoMes = (allPay ?? []).filter((x) => x.paid_at.startsWith(month)).reduce((s, x) => s + Number(x.amount), 0)
  const porCobrar = withBalance.reduce((s, x) => s + x.saldo, 0)
  const canVisit = profile.role === 'administrador'
  const kpis: [string, string][] = [['Cobrado este mes', cop(cobradoMes)], ['Por cobrar (trabajos)', cop(porCobrar)], ['Visitas sin pago', String(visits.length)]]

  return (
    <>
      <h1 className={ui.h1}>Facturación y pagos</h1>
      <p className="text-slate-500 mb-4">Aquí se registran anticipos, abonos y pagos finales. Las facturas se agregan en la Fase 8.</p>
      {error && <div className={ui.err}>{error}</div>}
      <div className="grid gap-3 grid-cols-3 mb-4">
        {kpis.map(([l, val]) => <div key={l} className={ui.kpi}><div className="text-xs text-slate-500">{l}</div><div className="text-lg font-bold">{val}</div></div>)}
      </div>

      <form action={createPayment} className={ui.card}>
        <h2 className="font-semibold mb-3">Registrar pago</h2>
        {withBalance.length || (canVisit && visits.length) ? (
          <>
            <div className={ui.grid}>
              <div><label className={ui.lbl}>¿Qué se está pagando? *</label>
                <select name="target" required className={ui.inp}>
                  {withBalance.map((x) => <option key={x.id} value={`wo:${x.id}`}>OT-{String(x.seq).padStart(3, '0')} · {nm(x.clients)} · saldo {cop(x.saldo)}</option>)}
                  {canVisit && visits.map((x) => <option key={x.id} value={`vt:${x.id}`}>VT-{String(x.seq).padStart(3, '0')} · {nm(x.clients)} · visita {cop(Number(x.price))}</option>)}
                </select></div>
              <div><label className={ui.lbl}>Tipo (trabajos)</label>
                <select name="kind" className={ui.inp}>{KIND.filter(([k]) => k !== 'visita').map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              <div><label className={ui.lbl}>Valor (COP) — en visitas se usa el valor de la visita</label><input name="amount" type="number" min="1" className={ui.inp} /></div>
              <div><label className={ui.lbl}>Método</label>
                <select name="method" className={ui.inp}>{METHODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              <div><label className={ui.lbl}>Fecha</label><input name="paid_at" type="date" defaultValue={today()} className={ui.inp} /></div>
              <div><label className={ui.lbl}>Nota</label><input name="notes" className={ui.inp} /></div>
            </div>
            <button className={ui.btn}>Registrar pago</button>
          </>
        ) : <p className={ui.empty}>No hay trabajos con saldo ni visitas pendientes de pago todavía.</p>}
      </form>

      {withBalance.length > 0 && (
        <div className={ui.card + ' overflow-x-auto'}>
          <h2 className="font-semibold mb-2">Cuentas por cobrar</h2>
          <table className={ui.table}>
            <thead><tr><th className={ui.th}>Trabajo</th><th className={ui.th}>Cliente</th><th className={ui.th}>Vendido</th><th className={ui.th}>Pagado</th><th className={ui.th}>Saldo</th></tr></thead>
            <tbody>
              {withBalance.map((x) => (
                <tr key={x.id}><td className={ui.td}>OT-{String(x.seq).padStart(3, '0')}</td><td className={ui.td}>{nm(x.clients)}</td>
                  <td className={ui.td}>{cop(Number(x.sale_total))}</td><td className={ui.td}>{cop(x.paid)}</td><td className={ui.td + ' font-semibold'}>{cop(x.saldo)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={ui.card + ' overflow-x-auto'}>
        <h2 className="font-semibold mb-2">Historial de pagos</h2>
        {pays.length ? (
          <table className={ui.table}>
            <thead><tr><th className={ui.th}>Fecha</th><th className={ui.th}>Cliente</th><th className={ui.th}>Concepto</th><th className={ui.th}>Tipo</th><th className={ui.th}>Método</th><th className={ui.th}>Valor</th><th className={ui.th}></th></tr></thead>
            <tbody>
              {pays.map((x) => (
                <tr key={x.id}>
                  <td className={ui.td}>{fdate(x.paid_at)}</td><td className={ui.td}>{nm(x.clients)}</td>
                  <td className={ui.td}>{x.work_orders ? `OT-${String(x.work_orders.seq).padStart(3, '0')}` : x.visits ? `VT-${String(x.visits.seq).padStart(3, '0')}` : ''}</td>
                  <td className={ui.td}>{label(KIND, x.kind)}</td><td className={ui.td}>{label(METHODS, x.method)}</td>
                  <td className={ui.td + ' font-semibold'}>{cop(Number(x.amount))}</td>
                  <td className={ui.td}>
                    {profile.role === 'administrador' && x.kind !== 'visita' && (
                      <form action={deletePayment}><input type="hidden" name="id" value={x.id} /><ConfirmAction label="Eliminar" message="¿Eliminar este pago?" /></form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className={ui.empty}>Aún no hay pagos registrados.</p>}
      </div>
    </>
  )
}
