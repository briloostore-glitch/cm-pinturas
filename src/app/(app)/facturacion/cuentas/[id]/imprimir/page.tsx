import { notFound } from 'next/navigation'
import { guard } from '@/lib/guard'
import { cop, fdate } from '@/lib/money'
import { pesosEnLetras } from '@/lib/words'
import { getCompany } from '@/lib/docs'
import PrintBar from '@/components/PrintBar'
import '@/styles/doc.css'

export default async function ImprimirCuenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await guard('facturacion')
  const { data: inv } = await supabase.from('invoices').select('*').eq('id', id).single()
  if (!inv) notFound()
  const [{ data: it }, C] = await Promise.all([
    supabase.from('invoice_items').select('description,unit,qty,unit_price').eq('invoice_id', id).order('id'),
    getCompany(supabase),
  ])
  const items = it ?? []
  const blanks = Math.max(0, 8 - items.length)
  const advances = Number(inv.advances), toPay = Number(inv.total) - advances

  return (
    <>
      <PrintBar back={`/facturacion/cuentas/${id}`} />
      <div className="dc">
        <div className="dh">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" />
          <div style={{ flex: 1 }}>
            <div className="cn">{C.name.toUpperCase()}</div>
            <div><b>{C.owner}</b></div><div>NIT: {C.nit}</div><div>{C.contact}</div><div>{C.location}</div>
          </div>
          <div className="dr">
            <div className="ct">CUENTA DE COBRO</div>
            <table><tbody>
              <tr><td>N.º</td><td>{String(inv.seq).padStart(3, '0')}</td></tr>
              <tr><td>Fecha</td><td>{fdate(inv.issued_at)}</td></tr>
              <tr><td>Vence</td><td>{inv.due_text}</td></tr>
            </tbody></table>
          </div>
        </div>

        <table><tbody>
          <tr><td className="nv" colSpan={2}>COBRAR A</td></tr>
          <tr><td className="lb">Cliente:</td><td>{inv.client_name}</td></tr>
          <tr><td className="lb">NIT / C.C.:</td><td>{inv.client_doc}</td></tr>
          <tr><td className="lb">Teléfono:</td><td>{inv.client_phone}</td></tr>
          <tr><td className="lb">Obra:</td><td>{inv.work_address}</td></tr>
        </tbody></table>
        <div className="gp" />

        <table>
          <thead><tr><th>Ítem</th><th style={{ width: '40%' }}>Concepto</th><th>Unidad</th><th>Cantidad</th><th>Valor unitario</th><th>Valor total</th></tr></thead>
          <tbody>
            {items.map((r, n) => (
              <tr key={n}>
                <td align="center">{n + 1}</td><td>{r.description}</td><td align="center">{r.unit}</td><td align="center">{Number(r.qty)}</td>
                <td align="right">{cop(Number(r.unit_price))}</td><td align="right">{cop(Math.round(Number(r.qty) * Number(r.unit_price)))}</td>
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
            <td rowSpan={4} style={{ width: '50%', verticalAlign: 'top' }}>{pesosEnLetras(toPay)}</td>
            <td className="rb" colSpan={2}>Subtotal</td><td align="right">{cop(Number(inv.subtotal))}</td>
          </tr>
          <tr><td className="rb">IVA</td><td align="right">{Number(inv.tax_percent)}%</td><td align="right">{Number(inv.tax) ? cop(Number(inv.tax)) : '-'}</td></tr>
          <tr><td className="rb">Abonos recibidos</td><td align="right">{advances ? '' : '-'}</td><td align="right">{advances ? `− ${cop(advances)}` : '-'}</td></tr>
          <tr><td className="nv rb" colSpan={2} style={{ color: '#fff' }}>TOTAL A PAGAR</td><td className="nv" align="right">{cop(toPay)}</td></tr>
        </tbody></table>
        <div className="gp" />

        <table><tbody>
          <tr><td className="nv" colSpan={2}>FORMA DE PAGO</td></tr>
          <tr><td className="lb">Medios:</td><td>{inv.payment_means}</td></tr>
          <tr><td className="lb">A nombre de:</td><td>{inv.payee}</td></tr>
          <tr><td className="lb">Nota:</td><td>{inv.note}</td></tr>
        </tbody></table>

        <div className="sg">
          <div>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/firma.png" alt="" />{C.owner} · {C.name}</div>
          <div>Recibí conforme (firma, nombre y fecha)</div>
        </div>
        <div className="pie">{inv.footer}</div>
      </div>
    </>
  )
}
