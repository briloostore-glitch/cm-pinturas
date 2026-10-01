import { guard } from '@/lib/guard'
import { ui } from '@/lib/ui'
import { cop, fdate, label, today, EXPENSE_CATS } from '@/lib/money'
import ConfirmAction from '@/components/ConfirmAction'
import ReceiptUpload from '@/components/ReceiptUpload'
import { createExpense, deleteExpense } from './actions'

type Exp = {
  id: string; category: string; description: string | null; amount: number; spent_at: string; receipt_path: string | null
  work_orders: { seq: number } | null; suppliers: { company: string } | null
}

export default async function Gastos({ searchParams }: { searchParams: Promise<{ mes?: string; cat?: string; error?: string }> }) {
  const sp = await searchParams
  const { supabase } = await guard('gastos')
  const mes = /^\d{4}-\d{2}$/.test(sp.mes ?? '') ? sp.mes! : today().slice(0, 7)
  const [y, m] = mes.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()

  let q = supabase.from('expenses')
    .select('id,category,description,amount,spent_at,receipt_path,work_orders(seq),suppliers(company)')
    .gte('spent_at', `${mes}-01`).lte('spent_at', `${mes}-${String(last).padStart(2, '0')}`)
    .order('spent_at', { ascending: false })
  if (sp.cat) q = q.eq('category', sp.cat)
  const [{ data }, { data: orders }, { data: suppliers }] = await Promise.all([
    q,
    supabase.from('work_orders').select('id,seq').order('seq', { ascending: false }).limit(100),
    supabase.from('suppliers').select('id,company').order('company'),
  ])
  const rows = (data ?? []) as unknown as Exp[]

  // Enlaces temporales a los comprobantes (la carpeta es privada)
  const paths = rows.map((r) => r.receipt_path).filter(Boolean) as string[]
  const urls = new Map<string, string>()
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('receipts').createSignedUrls(paths, 3600)
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl)
  }

  const total = rows.reduce((s, r) => s + Number(r.amount), 0)
  const byCat = EXPENSE_CATS.map(([k, l]) => [l, rows.filter((r) => r.category === k).reduce((s, r) => s + Number(r.amount), 0)] as const).filter(([, v]) => v > 0)

  return (
    <>
      <h1 className={ui.h1 + ' mb-4'}>Gastos</h1>
      {sp.error && <div className={ui.err}>{sp.error}</div>}
      <form action={createExpense} className={ui.card}>
        <h2 className="font-semibold mb-3">Registrar gasto</h2>
        <div className={ui.grid}>
          <div><label className={ui.lbl}>Categoría</label>
            <select name="category" className={ui.inp}>{EXPENSE_CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <div><label className={ui.lbl}>Valor (COP) *</label><input name="amount" type="number" min="1" required className={ui.inp} /></div>
          <div><label className={ui.lbl}>Fecha</label><input name="spent_at" type="date" defaultValue={today()} className={ui.inp} /></div>
          <div><label className={ui.lbl}>Descripción</label><input name="description" className={ui.inp} /></div>
          <div><label className={ui.lbl}>Trabajo (opcional)</label>
            <select name="work_order_id" className={ui.inp}><option value="">General</option>
              {(orders ?? []).map((o) => <option key={o.id} value={o.id}>OT-{String(o.seq).padStart(3, '0')}</option>)}</select></div>
          <div><label className={ui.lbl}>Proveedor (opcional)</label>
            <select name="supplier_id" className={ui.inp}><option value="">Ninguno</option>
              {(suppliers ?? []).map((s) => <option key={s.id} value={s.id}>{s.company}</option>)}</select></div>
          <div><label className={ui.lbl}>Comprobante (foto o PDF)</label><ReceiptUpload /></div>
        </div>
        <button className={ui.btn}>Guardar gasto</button>
      </form>

      <form method="get" className="flex flex-wrap gap-2 mb-3 items-end">
        <div><label className={ui.lbl}>Mes</label><input type="month" name="mes" defaultValue={mes} className={ui.inp} /></div>
        <div><label className={ui.lbl}>Categoría</label>
          <select name="cat" defaultValue={sp.cat ?? ''} className={ui.inp}><option value="">Todas</option>
            {EXPENSE_CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <button className={ui.btnG}>Filtrar</button>
      </form>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
        <div className={ui.kpi}><div className="text-xs text-slate-500">Total del mes</div><div className="text-lg font-bold">{cop(total)}</div></div>
        {byCat.map(([l, v]) => <div key={l} className={ui.kpi}><div className="text-xs text-slate-500">{l}</div><div className="text-lg font-bold">{cop(v)}</div></div>)}
      </div>

      <div className={ui.card + ' overflow-x-auto'}>
        {rows.length ? (
          <table className={ui.table}>
            <thead><tr><th className={ui.th}>Fecha</th><th className={ui.th}>Categoría</th><th className={ui.th}>Descripción</th><th className={ui.th}>Trabajo</th><th className={ui.th}>Proveedor</th><th className={ui.th}>Valor</th><th className={ui.th}>Comprobante</th><th className={ui.th}></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={ui.td}>{fdate(r.spent_at)}</td><td className={ui.td}>{label(EXPENSE_CATS, r.category)}</td>
                  <td className={ui.td}>{r.description}</td>
                  <td className={ui.td}>{r.work_orders ? `OT-${String(r.work_orders.seq).padStart(3, '0')}` : 'General'}</td>
                  <td className={ui.td}>{r.suppliers?.company}</td><td className={ui.td + ' font-semibold'}>{cop(Number(r.amount))}</td>
                  <td className={ui.td}>{r.receipt_path && urls.get(r.receipt_path) ? <a href={urls.get(r.receipt_path)} target="_blank" className="text-navy underline">Ver</a> : '—'}</td>
                  <td className={ui.td}>
                    <form action={deleteExpense}><input type="hidden" name="id" value={r.id} /><ConfirmAction label="Eliminar" message="¿Eliminar este gasto?" /></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className={ui.empty}>No hay gastos en este período.</p>}
      </div>
    </>
  )
}
