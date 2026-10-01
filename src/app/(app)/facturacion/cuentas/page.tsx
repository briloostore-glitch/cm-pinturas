import Link from 'next/link'
import { guard } from '@/lib/guard'
import { ui } from '@/lib/ui'
import { cop, fdate } from '@/lib/money'
import { getInvoiceDefaults } from '@/lib/docs'
import FacturacionTabs from '@/components/FacturacionTabs'
import { updateInvoiceDefaults } from './actions'

export default async function Cuentas({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await guard('facturacion')
  const [{ data }, d] = await Promise.all([
    supabase.from('invoices').select('id,seq,issued_at,status,total,advances,client_name').order('seq', { ascending: false }).limit(200),
    getInvoiceDefaults(supabase),
  ])
  const rows = data ?? []

  return (
    <>
      <FacturacionTabs active="cuentas" />
      <div className="flex items-center justify-between mb-4">
        <h1 className={ui.h1}>Cuentas de cobro</h1>
        <Link href="/facturacion/cuentas/nueva" className={ui.btnO}>+ Nueva cuenta de cobro</Link>
      </div>
      {error && <div className={ui.err}>{error}</div>}
      <div className={ui.card + ' overflow-x-auto'}>
        {rows.length ? (
          <table className={ui.table}>
            <thead><tr><th className={ui.th}>N.º</th><th className={ui.th}>Fecha</th><th className={ui.th}>Cliente</th><th className={ui.th}>Valor</th><th className={ui.th}>Abonos</th><th className={ui.th}>Por pagar</th><th className={ui.th}>Estado</th><th className={ui.th}></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={ui.td}>{String(r.seq).padStart(3, '0')}</td><td className={ui.td}>{fdate(r.issued_at)}</td><td className={ui.td}>{r.client_name}</td>
                  <td className={ui.td}>{cop(Number(r.total))}</td><td className={ui.td}>{cop(Number(r.advances))}</td>
                  <td className={ui.td + ' font-semibold'}>{cop(Number(r.total) - Number(r.advances))}</td><td className={ui.td}>{r.status.replace('_', ' ')}</td>
                  <td className={ui.td}><Link href={`/facturacion/cuentas/${r.id}`} className={ui.btnG}>Editar / imprimir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className={ui.empty}>Aún no hay cuentas de cobro.</p>}
      </div>

      <form action={updateInvoiceDefaults} className={ui.card}>
        <h2 className="font-semibold mb-1">Valores por defecto de cada cuenta nueva</h2>
        <p className="text-xs text-slate-500 mb-3">Cada cuenta guarda su propia copia y se puede editar sin cambiar estos valores.</p>
        <div className={ui.grid}>
          <div><label className={ui.lbl}>Vence</label><input name="due_text" defaultValue={d.due_text} className={ui.inp} /></div>
          <div className="col-span-full"><label className={ui.lbl}>Medios de pago (cuenta o número)</label><input name="payment_means" defaultValue={d.payment_means} className={ui.inp} /></div>
          <div className="col-span-full"><label className={ui.lbl}>A nombre de</label><input name="payee" defaultValue={d.payee} className={ui.inp} /></div>
          <div className="col-span-full"><label className={ui.lbl}>Nota (régimen tributario)</label><input name="note" defaultValue={d.note} className={ui.inp} /></div>
          <div className="col-span-full"><label className={ui.lbl}>Mensaje del pie</label><input name="footer" defaultValue={d.footer} className={ui.inp} /></div>
        </div>
        <button className={ui.btn}>Guardar valores por defecto</button>
      </form>
    </>
  )
}
