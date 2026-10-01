import { guard } from '@/lib/guard'
import { ui } from '@/lib/ui'
import { cop } from '@/lib/money'
import FacturacionTabs from '@/components/FacturacionTabs'
import { createInvoice } from '../actions'

type O = { id: string; seq: number; sale_total: number; clients: { first_name: string; last_name: string | null } | null }

export default async function NuevaCuenta({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await guard('facturacion')
  const [{ data: o }, { data: clients }] = await Promise.all([
    supabase.from('work_orders').select('id,seq,sale_total,clients(first_name,last_name)').neq('status', 'cancelado').order('seq', { ascending: false }),
    supabase.from('clients').select('id,first_name,last_name').order('first_name'),
  ])
  const orders = (o ?? []) as unknown as O[]

  return (
    <>
      <FacturacionTabs active="cuentas" />
      <h1 className={ui.h1 + ' mb-4'}>Nueva cuenta de cobro</h1>
      {error && <div className={ui.err}>{error}</div>}
      <form action={createInvoice} className={ui.card}>
        <div className={ui.grid}>
          <div>
            <label className={ui.lbl}>Desde un trabajo (llena cliente, obra, concepto y abonos)</label>
            <select name="work_order_id" className={ui.inp}>
              <option value="">— Ninguno —</option>
              {orders.map((x) => <option key={x.id} value={x.id}>OT-{String(x.seq).padStart(3, '0')} · {x.clients?.first_name} {x.clients?.last_name} · {cop(Number(x.sale_total))}</option>)}
            </select>
          </div>
          <div>
            <label className={ui.lbl}>O en blanco para un cliente</label>
            <select name="client_id" className={ui.inp}>
              <option value="">— Ninguno —</option>
              {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
        </div>
        <button className={ui.btn}>Crear y editar</button>
      </form>
    </>
  )
}
