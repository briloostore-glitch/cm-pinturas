import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { cop } from '@/lib/format'
import { clientesPorId, nombre, estado } from '@/lib/labels'
import { rango, atajos, suma, agruparSuma, contar, dmy } from '@/lib/reportes'
import PrintButton from '@/components/PrintButton'

const TOPE = 1000
const COSTOS = ['cost_materials', 'cost_labor', 'cost_transport', 'cost_other']

function Kpi({ t, v, s }: { t: string; v: string; s?: string }) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="lbl">{t}</div>
      <div className="text-xl font-bold text-navy">{v}</div>
      {s && <div className="text-xs text-slate-500">{s}</div>}
    </div>
  )
}

function Barras({ datos }: { datos: [string, number][] }) {
  if (!datos.length) return <p className="text-sm text-slate-500">Sin datos en el periodo.</p>
  const max = Math.max(1, ...datos.map((d) => d[1]))
  return (
    <div className="space-y-2">
      {datos.map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between text-sm"><span>{estado(k)}</span><b>{cop(v)}</b></div>
          <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-accent" style={{ width: `${Math.round((v / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

export default async function Reportes({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const sp = await searchParams
  const { supabase } = await requireModule('reportes')
  const r = rango(sp.desde, sp.hasta)

  const [rq, rv, rvp, rw, rp, re, ri, rm, ro] = await Promise.all([
    supabase.from('quotes').select('status,total').gte('created_at', r.desdeTs).lt('created_at', r.hastaTs).limit(TOPE),
    supabase.from('visits').select('status').gte('created_at', r.desdeTs).lt('created_at', r.hastaTs).limit(TOPE),
    supabase.from('visits').select('paid_amount').gte('paid_at', r.desde).lte('paid_at', r.hasta).limit(TOPE),
    supabase.from('work_orders').select('status,sale_total,cost_materials,cost_labor,cost_transport,cost_other').gte('created_at', r.desdeTs).lt('created_at', r.hastaTs).limit(TOPE),
    supabase.from('payments').select('amount,kind,method').gte('paid_at', r.desde).lte('paid_at', r.hasta).limit(TOPE),
    supabase.from('expenses').select('amount,category').gte('spent_at', r.desde).lte('spent_at', r.hasta).limit(TOPE),
    supabase.from('invoices').select('status,total').gte('issued_at', r.desde).lte('issued_at', r.hasta).limit(TOPE),
    supabase.from('materials').select('id,name,stock,min_stock,unit').eq('active', true).limit(TOPE),
    supabase.from('work_orders').select('id,seq,client_id,status,sale_total').neq('status', 'cancelado').order('created_at', { ascending: false }).limit(100),
  ])
  const errores = [rq, rv, rvp, rw, rp, re, ri, rm, ro].filter((x) => x.error).map((x) => x.error!.message)
  const quotes = rq.data ?? [], visitas = rv.data ?? [], visPagadas = rvp.data ?? [], trabajos = rw.data ?? []
  const pagos = rp.data ?? [], gastos = re.data ?? [], facturas = ri.data ?? [], mats = rm.data ?? [], ots = ro.data ?? []
  const truncado = [quotes, visitas, visPagadas, trabajos, pagos, gastos, facturas, mats].some((a) => a.length >= TOPE)

  // Saldos por cobrar de los 100 trabajos mas recientes
  const ids = ots.map((o) => o.id)
  const pagosOt = ids.length ? (await supabase.from('payments').select('work_order_id,amount').in('work_order_id', ids)).data ?? [] : []
  const pagado = new Map<string, number>()
  for (const p of pagosOt) pagado.set(p.work_order_id, (pagado.get(p.work_order_id) ?? 0) + Number(p.amount))
  const saldos = ots
    .map((o) => ({ ...o, saldo: Number(o.sale_total) - (pagado.get(o.id) ?? 0) }))
    .filter((o) => o.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, 15)
  const cl = await clientesPorId(supabase, saldos.map((s) => s.client_id))

  const aprobadas = quotes.filter((x) => x.status === 'aprobada').length
  const tasa = quotes.length ? Math.round((aprobadas / quotes.length) * 100) : 0
  const activos = trabajos.filter((x) => x.status !== 'cancelado')
  const venta = suma(activos, 'sale_total')
  const costos = COSTOS.reduce((a, k) => a + suma(activos, k), 0)
  const cobrado = suma(pagos, 'amount')
  const totalGastos = suma(gastos, 'amount')
  const facturado = suma(facturas.filter((f) => f.status !== 'cancelada'), 'total')
  const bajos = mats.filter((m) => Number(m.stock) <= Number(m.min_stock)).sort((a, b) => Number(a.stock) - Number(b.stock))
  const porEstado = contar(trabajos, 'status').map(([e, n]) => {
    const g = trabajos.filter((x) => x.status === e)
    return { e, n, ve: suma(g, 'sale_total'), co: COSTOS.reduce((a, k) => a + suma(g, k), 0) }
  })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="text-2xl font-bold text-navy">Reportes</h1>
        <PrintButton />
      </div>
      <p className="text-sm text-slate-500 mb-3">Periodo: {dmy(r.desde)} al {dmy(r.hasta)}</p>
      <div className="print:hidden mb-4">
        <form className="flex flex-wrap items-end gap-2 mb-2">
          <div><label className="lbl">Desde</label><input type="date" name="desde" defaultValue={r.desde} className="inp" /></div>
          <div><label className="lbl">Hasta</label><input type="date" name="hasta" defaultValue={r.hasta} className="inp" /></div>
          <button type="submit" className="btn">Ver reporte</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {atajos().map((a) => <Link key={a.t} href={`/reportes?desde=${a.d}&hasta=${a.h}`} className="btn btn-g">{a.t}</Link>)}
        </div>
      </div>

      {errores.length > 0 && <div className="err">No se pudieron leer algunos datos: {Array.from(new Set(errores)).join(' | ')}</div>}
      {truncado && <div className="err">Algún dato superó {TOPE} filas y los totales pueden estar incompletos. Acorta el periodo.</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi t="Cotizado" v={cop(suma(quotes, 'total'))} s={`${quotes.length} cotizaciones, ${aprobadas} aprobadas (${tasa}%)`} />
        <Kpi t="Vendido en trabajos" v={cop(venta)} s={`${activos.length} trabajos`} />
        <Kpi t="Cobrado" v={cop(cobrado)} s={`${pagos.length} pagos registrados`} />
        <Kpi t="Gastos" v={cop(totalGastos)} s={`${gastos.length} gastos`} />
        <Kpi t="Utilidad de trabajos" v={cop(venta - costos)} s={`Venta menos costos (${cop(costos)})`} />
        <Kpi t="Visitas pagadas" v={cop(suma(visPagadas, 'paid_amount'))} s={`${visPagadas.length} pagadas, ${visitas.length} solicitadas`} />
        <Kpi t="Facturado" v={cop(facturado)} s={`${facturas.length} facturas emitidas`} />
        <Kpi t="Stock bajo" v={String(bajos.length)} s="materiales en o bajo el mínimo" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card"><h2 className="font-bold text-navy mb-2">Cobros por tipo</h2><Barras datos={agruparSuma(pagos, 'kind', 'amount')} /></div>
        <div className="card"><h2 className="font-bold text-navy mb-2">Cobros por método</h2><Barras datos={agruparSuma(pagos, 'method', 'amount')} /></div>
        <div className="card"><h2 className="font-bold text-navy mb-2">Gastos por categoría</h2><Barras datos={agruparSuma(gastos, 'category', 'amount')} /></div>
        <div className="card"><h2 className="font-bold text-navy mb-2">Facturas por estado</h2><Barras datos={agruparSuma(facturas, 'status', 'total')} /></div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-bold text-navy mb-2">Trabajos por estado</h2>
        <table className="tbl">
          <thead><tr><th>Estado</th><th>Cantidad</th><th>Venta</th><th>Costos</th><th>Utilidad</th></tr></thead>
          <tbody>
            {porEstado.map((x) => (
              <tr key={x.e}><td>{estado(x.e)}</td><td>{x.n}</td><td>{cop(x.ve)}</td><td>{cop(x.co)}</td><td>{cop(x.ve - x.co)}</td></tr>
            ))}
            {!porEstado.length && <tr><td colSpan={5} className="text-slate-500">Sin trabajos en el periodo.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-bold text-navy mb-1">Saldos por cobrar</h2>
        <p className="text-xs text-slate-500 mb-2">De los 100 trabajos más recientes, sin importar el periodo.</p>
        <table className="tbl">
          <thead><tr><th>Trabajo</th><th>Cliente</th><th>Estado</th><th>Venta</th><th>Saldo</th><th></th></tr></thead>
          <tbody>
            {saldos.map((s) => (
              <tr key={s.id}>
                <td>{String(s.seq).padStart(3, '0')}</td><td>{nombre(cl.get(s.client_id))}</td><td>{estado(s.status)}</td>
                <td>{cop(Number(s.sale_total))}</td><td><b>{cop(s.saldo)}</b></td>
                <td><Link href={`/trabajos/${s.id}`} className="btn btn-g print:hidden">Abrir</Link></td>
              </tr>
            ))}
            {!saldos.length && <tr><td colSpan={6} className="text-slate-500">No hay saldos pendientes.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-bold text-navy mb-2">Materiales con stock bajo</h2>
        <table className="tbl">
          <thead><tr><th>Material</th><th>Stock</th><th>Mínimo</th><th></th></tr></thead>
          <tbody>
            {bajos.slice(0, 15).map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td><td>{Number(m.stock)} {m.unit ?? ''}</td><td>{Number(m.min_stock)}</td>
                <td><Link href={`/inventario/${m.id}`} className="btn btn-g print:hidden">Abrir</Link></td>
              </tr>
            ))}
            {!bajos.length && <tr><td colSpan={4} className="text-slate-500">Todo el inventario está sobre el mínimo.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}