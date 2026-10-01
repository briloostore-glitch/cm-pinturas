import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { cop, fdate, pesosEnLetras } from '@/lib/format'
import { getSettings } from '@/lib/settings'
import PrintButton from '@/components/PrintButton'

type Q = {
  id: string; seq: number; mode: number; city: string; area_m2: number; transport: number; other_costs: number
  margin_percent: number; tax_percent: number; subtotal: number; tax: number; visit_credit: number; total: number
  valid_days: number; created_at: string
  clients: { first_name: string; last_name: string | null; document: string | null; phone: string | null; address: string | null } | null
  properties: { address: string | null } | null
}

export default async function Imprimir({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireModule('cotizaciones')
  const { data } = await supabase
    .from('quotes')
    .select('*, clients(first_name,last_name,document,phone,address), properties(address)')
    .eq('id', id).single()
  if (!data) notFound()
  const q = data as unknown as Q
  const [{ data: items }, st] = await Promise.all([supabase.from('quote_items').select('*').eq('quote_id', id), getSettings(supabase)])
  const C = st.company, T = st.quote_terms, m = q.mode === 1

  // La utilidad se reparte dentro de cada valor (el formato no tiene línea de utilidad)
  const k = 1 + Number(q.margin_percent) / 100
  const rows: { d: string; u: string; q: number; t: number }[] = (items ?? []).map((i) => ({ d: i.description, u: 'm²', q: Number(i.qty), t: Number(i.total) * k }))
  if (Number(q.transport) > 0) rows.push({ d: `Transporte (${q.city})`, u: 'und', q: 1, t: Number(q.transport) * k })
  if (Number(q.other_costs) > 0) rows.push({ d: 'Otros costos', u: 'und', q: 1, t: Number(q.other_costs) * k })

  const total = Number(q.total), anticipo = (total * st.deposit_percent) / 100
  const hayCredito = Number(q.visit_credit) > 0
  const blanks = Math.max(0, 12 - rows.length)
  const includes = m ? T.includes : 'Mano de obra (materiales suministrados por el cliente), protección de pisos y muebles, y limpieza final.'

  return (
    <>
      <div className="flex gap-2 mb-4 print:hidden">
        <Link href={`/cotizaciones/${q.id}`} className="btn btn-g">Volver</Link>
        <PrintButton />
      </div>
      <div className="dc">
        <div className="dh">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" />
          <div style={{ flex: 1 }}>
            <div className="cn">{C.name.toUpperCase()}</div>
            <div><b>{C.owner}</b></div>
            <div>NIT: {C.nit}</div>
            <div>{C.contact}</div>
            <div>{C.location}</div>
          </div>
          <div className="dr">
            <div className="ct">COTIZACIÓN</div>
            <table><tbody>
              <tr><td>N.º</td><td>{String(q.seq).padStart(3, '0')}</td></tr>
              <tr><td>Fecha</td><td>{fdate(q.created_at)}</td></tr>
              <tr><td>Validez</td><td>{q.valid_days} días</td></tr>
            </tbody></table>
          </div>
        </div>

        <table><tbody>
          <tr><td className="nv" colSpan={2}>DATOS DEL CLIENTE</td></tr>
          <tr><td className="lb">Cliente:</td><td>{q.clients?.first_name} {q.clients?.last_name}</td></tr>
          <tr><td className="lb">NIT / C.C.:</td><td>{q.clients?.document}</td></tr>
          <tr><td className="lb">Teléfono:</td><td>{q.clients?.phone}</td></tr>
          <tr><td className="lb">Obra:</td><td>{q.properties?.address || q.clients?.address || q.city}</td></tr>
        </tbody></table>
        <div className="gp" />

        <table>
          <thead><tr><th>Ítem</th><th style={{ width: '40%' }}>Descripción del trabajo</th><th>Unidad</th><th>Cantidad</th><th>Valor unitario</th><th>Valor total</th></tr></thead>
          <tbody>
            {rows.map((r, n) => (
              <tr key={n}>
                <td align="center">{n + 1}</td><td>{r.d}</td><td align="center">{r.u}</td><td align="center">{r.q}</td>
                <td align="right">{cop(r.t / r.q)}</td><td align="right">{cop(r.t)}</td>
              </tr>
            ))}
            {Array.from({ length: blanks }).map((_, n) => (
              <tr key={`b${n}`}><td></td><td></td><td></td><td></td><td></td><td align="right">-</td></tr>
            ))}
          </tbody>
        </table>
        <div className="gp" />

        <table><tbody>
          <tr>
            <td rowSpan={hayCredito ? 6 : 5} style={{ width: '50%', verticalAlign: 'top' }}>{pesosEnLetras(total)}</td>
            <td className="rb" colSpan={2}>Subtotal</td><td align="right">{cop(Number(q.subtotal))}</td>
          </tr>
          <tr><td className="rb">IVA</td><td align="right">{q.tax_percent}%</td><td align="right">{Number(q.tax) ? cop(Number(q.tax)) : '-'}</td></tr>
          {hayCredito && (
            <tr><td className="rb" colSpan={2}>Visita técnica pagada</td><td align="right">− {cop(Number(q.visit_credit))}</td></tr>
          )}
          <tr><td className="nv rb" colSpan={2} style={{ color: '#fff' }}>TOTAL</td><td className="nv" align="right">{cop(total)}</td></tr>
          <tr><td className="rb">Anticipo</td><td align="right">{st.deposit_percent}%</td><td align="right">{cop(anticipo)}</td></tr>
          <tr><td className="rb" colSpan={2}>Saldo a la entrega</td><td align="right"><b>{cop(total - anticipo)}</b></td></tr>
        </tbody></table>
        <div className="gp" />

        <table><tbody>
          <tr><td className="nv" colSpan={2}>CONDICIONES</td></tr>
          <tr><td className="lb">Incluye:</td><td>{includes}</td></tr>
          <tr><td className="lb">No incluye:</td><td>{T.excludes}</td></tr>
          <tr><td className="lb">Pago:</td><td>{T.payment}</td></tr>
          <tr><td className="lb">Tiempo:</td><td>{T.time}</td></tr>
          <tr><td className="lb">Garantía:</td><td>{T.warranty}</td></tr>
        </tbody></table>

        <div className="sg">
          <div>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/firma.png" alt="" />{C.owner} · {C.name}</div>
          <div>Aceptación del cliente (firma, nombre y fecha)</div>
        </div>
        <div className="pie">{T.footer}</div>
      </div>
    </>
  )
}