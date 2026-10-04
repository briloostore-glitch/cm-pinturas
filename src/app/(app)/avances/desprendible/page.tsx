import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { cop } from '@/lib/format'
import { getSettings } from '@/lib/settings'
import PrintButton from '@/components/PrintButton'
import { fechaCorta } from '@/components/MiPago'
import type { Pago } from '@/components/MiPago'

type Fila = Pago['periodos'][number]

export default async function Desprendible() {
  const { supabase } = await requireModule('avances')
  const [{ data }, st] = await Promise.all([supabase.rpc('mi_pago'), getSettings(supabase)])
  const pago = (data as (Pago & { documento?: string | null }) | null) ?? null
  const C = st.company

  if (!pago) {
    return (
      <>
        <div className="flex gap-2 mb-4"><Link href="/avances" className="btn btn-g">Volver</Link></div>
        <div className="card text-sm">
          Tu usuario a&uacute;n no est&aacute; vinculado a un empleado, as&iacute; que no hay desprendible.
          P&iacute;dele al administrador que lo vincule en Cuadrillas y accesos.
        </div>
      </>
    )
  }

  const filas: Fila[] = pago.periodos
  const suma = (f: (p: Fila) => number | null) => filas.reduce((a, p) => a + Number(f(p) ?? 0), 0)
  const hoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' })
  const dia = Number(pago.valor_dia ?? 0)
  const adel = Number(pago.adelantos_total ?? 0)

  return (
    <>
      <div className="flex gap-2 mb-4 print:hidden">
        <Link href="/avances" className="btn btn-g">Volver</Link>
        <PrintButton />
      </div>
      <div className="dc">
        <div className="dh">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" />
          <div style={{ flex: 1 }}>
            <div className="cn">{String(C.name).toUpperCase()}</div>
            <div><b>{C.owner}</b></div>
            <div>NIT: {C.nit}</div>
            <div>{C.contact}</div>
            <div>{C.location}</div>
          </div>
          <div className="dr">
            <div className="ct">DESPRENDIBLE DE PAGO</div>
            <table><tbody>
              <tr><td>Fecha</td><td>{hoy}</td></tr>
              <tr><td>Per&iacute;odos</td><td>{filas.length}</td></tr>
            </tbody></table>
          </div>
        </div>

        <table><tbody>
          <tr><td className="nv" colSpan={2}>DATOS DEL TRABAJADOR</td></tr>
          <tr><td className="lb">Nombre:</td><td>{pago.empleado ?? '-'}</td></tr>
          <tr><td className="lb">Documento:</td><td>{pago.documento ?? '-'}</td></tr>
          <tr><td className="lb">Cargo:</td><td>{pago.cargo ?? '-'}</td></tr>
          <tr><td className="lb">Tipo de pago:</td><td>{pago.tipo_pago ?? '-'}</td></tr>
          <tr><td className="lb">Valor por d&iacute;a:</td><td>{dia > 0 ? cop(dia) : '-'}</td></tr>
          <tr><td className="lb">Fecha de ingreso:</td><td>{fechaCorta(pago.ingreso)}</td></tr>
          <tr><td className="lb">Adelantos recibidos:</td><td>{adel > 0 ? cop(adel) : 'Ninguno'}</td></tr>
        </tbody></table>
        <div className="gp" />

        <table>
          <thead>
            <tr>
              <th>Per&iacute;odo</th><th>D&iacute;as</th><th>Base</th><th>Bonos</th><th>Adelantos</th><th>Descuentos</th><th>Total a pagar</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((p, n) => (
              <tr key={n}>
                <td>{p.nombre ?? fechaCorta(p.desde)}<br /><span style={{ fontSize: 11 }}>{fechaCorta(p.desde)} al {fechaCorta(p.hasta)}</span></td>
                <td align="center">{Number(p.dias ?? 0)}</td>
                <td align="right">{cop(Number(p.base ?? 0))}</td>
                <td align="right">{Number(p.bono ?? 0) > 0 ? cop(Number(p.bono)) : '-'}</td>
                <td align="right">{Number(p.adelantos ?? 0) > 0 ? '- ' + cop(Number(p.adelantos)) : '-'}</td>
                <td align="right">{Number(p.descuentos ?? 0) > 0 ? '- ' + cop(Number(p.descuentos)) : '-'}</td>
                <td align="right"><b>{cop(Number(p.total ?? 0))}</b></td>
                <td>{p.pagado ? 'Pagado ' + fechaCorta(p.pagado_en) : 'Pendiente'}</td>
              </tr>
            ))}
            {!filas.length && (
              <tr><td colSpan={8} align="center">A&uacute;n no hay n&oacute;minas registradas.</td></tr>
            )}
            {filas.length > 0 && (
              <tr>
                <td className="nv" style={{ color: '#fff' }}>TOTALES</td>
                <td align="center"><b>{suma((p) => p.dias)}</b></td>
                <td align="right"><b>{cop(suma((p) => p.base))}</b></td>
                <td align="right"><b>{cop(suma((p) => p.bono))}</b></td>
                <td align="right"><b>{cop(suma((p) => p.adelantos))}</b></td>
                <td align="right"><b>{cop(suma((p) => p.descuentos))}</b></td>
                <td align="right"><b>{cop(suma((p) => p.total))}</b></td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="sg">
          <div>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/firma.png" alt="" />{C.owner} &middot; {C.name}</div>
          <div>Recibido por el trabajador (firma, nombre y fecha)</div>
        </div>
      </div>
    </>
  )
}