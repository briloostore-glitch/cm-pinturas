import type { CSSProperties } from 'react'
import Link from 'next/link'
import { cop } from '@/lib/format'
import ImprimirPeriodoButton from '@/components/ImprimirPeriodoButton'

type Periodo = {
  nombre: string | null; desde: string | null; hasta: string | null; dias: number | null; base: number | null
  bono: number | null; adelantos: number | null; descuentos: number | null; total: number | null
  pagado: boolean | null; pagado_en: string | null
}

export type Pago = {
  empleado: string | null; cargo: string | null; tipo_pago: string | null; valor_dia: number | null
  origen_valor: string; valor_trabajo: number | null; ingreso: string | null; adelantos_total: number | null
  periodos: Periodo[]
}

export const fechaCorta = (d: string | null | undefined) =>
  d ? new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

// Periodos sin movimiento (0 dias y $0) no se muestran
const sinMovimiento = (p: Periodo) => Number(p.dias ?? 0) === 0 && Number(p.total ?? 0) === 0

// Al imprimir un desprendible, solo se ve ese (el boton marca body[data-imprimir])
function cssImpresion(cuantos: number) {
  let css = '.desp-hoja{display:none}\n@media print{\n'
  css += 'html,body{height:auto!important;overflow:visible!important}\n'
  css += 'body[data-imprimir] *{visibility:hidden!important;overflow:visible!important;max-height:none!important}\n'
  for (let i = 0; i < cuantos; i++) {
    const b = 'body[data-imprimir="' + i + '"] #desp-' + i
    css += b + ',' + b + ' *{visibility:visible!important}\n'
    css += b + '{display:block!important;position:absolute;left:0;top:0;width:100%;padding:24px;background:#fff}\n'
  }
  return css + '}'
}

const celda: CSSProperties = { border: '1px solid #94a3b8', padding: '6px 10px' }

export default function MiPago({ pago }: { pago: Pago | null }) {
  if (!pago) {
    return (
      <div className="card text-sm">
        Tu usuario a&uacute;n no est&aacute; vinculado a un empleado, as&iacute; que no puedo mostrar tu pago.
        P&iacute;dele al administrador que lo vincule en Cuadrillas y accesos.
      </div>
    )
  }
  const dia = Number(pago.valor_dia ?? 0)
  const trabajo = Number(pago.valor_trabajo ?? 0)
  const adel = Number(pago.adelantos_total ?? 0)
  const caja: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', background: '#f8fafc' }
  const lista = (pago.periodos ?? []).filter((p) => !sinMovimiento(p))

  return (
    <>
      <style>{cssImpresion(lista.length)}</style>
      <div className="card" style={{ borderLeft: '4px solid #15803d' }}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 className="font-bold text-navy">Mi pago</h2>
          <Link href="/avances/desprendible" className="btn btn-o">Imprimir desprendible de pago</Link>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mb-3">
          {dia > 0 && (
            <div style={caja}>
              <div className="text-xs text-slate-500">Valor por d&iacute;a</div>
              <div className="text-lg font-bold">{cop(dia)}</div>
              <div className="text-xs text-slate-500">{pago.origen_valor === 'contrato' ? 'Seg\u00fan tu contrato firmado' : 'Seg\u00fan tu ficha'}</div>
            </div>
          )}
          {trabajo > 0 && (
            <div style={caja}>
              <div className="text-xs text-slate-500">Valor por trabajo</div>
              <div className="text-lg font-bold">{cop(trabajo)}</div>
            </div>
          )}
          <div style={caja}>
            <div className="text-xs text-slate-500">Adelantos recibidos</div>
            <div className="text-lg font-bold">{adel > 0 ? cop(adel) : 'Ninguno'}</div>
          </div>
          <div style={caja}>
            <div className="text-xs text-slate-500">Fecha de ingreso</div>
            <div className="text-lg font-bold">{fechaCorta(pago.ingreso)}</div>
          </div>
        </div>
        {lista.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Per&iacute;odo</th><th>D&iacute;as</th><th>Adelantos</th><th>Descuentos</th><th>Total</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {lista.map((p, n) => (
                  <tr key={n}>
                    <td>{p.nombre ?? fechaCorta(p.desde)}</td>
                    <td>{Number(p.dias ?? 0)}</td>
                    <td>{Number(p.adelantos ?? 0) > 0 ? cop(Number(p.adelantos)) : '-'}</td>
                    <td>{Number(p.descuentos ?? 0) > 0 ? cop(Number(p.descuentos)) : '-'}</td>
                    <td>{cop(Number(p.total ?? 0))}</td>
                    <td>{p.pagado ? 'Pagado ' + fechaCorta(p.pagado_en) : 'Pendiente'}</td>
                    <td>{p.pagado ? <ImprimirPeriodoButton n={n} /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">A&uacute;n no tienes n&oacute;minas registradas.</p>
        )}
      </div>

      {lista.map((p, n) => {
        if (!p.pagado) return null
        const dias = Number(p.dias ?? 0)
        const base = Number(p.base ?? 0)
        const porDia = dias > 0 ? base / dias : 0
        const filas: [string, string][] = [
          ['D\u00edas trabajados', String(dias)],
          ...(porDia > 0 ? ([['Valor por d\u00eda', cop(porDia)]] as [string, string][]) : []),
          ['Valor base', cop(base)],
          ['Bonificaciones', cop(Number(p.bono ?? 0))],
          ['Adelantos', cop(Number(p.adelantos ?? 0))],
          ['Descuentos', cop(Number(p.descuentos ?? 0))],
        ]
        return (
          <div key={'d' + n} id={'desp-' + n} className="desp-hoja" style={{ lineHeight: 1.6, fontSize: 14 }}>
            <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 18 }}>CM PINTURAS Y MANTENIMIENTO</h2>
            <h3 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 14 }}>DESPRENDIBLE DE PAGO</h3>
            <p><b>Trabajador:</b> {pago.empleado ?? '-'}</p>
            <p><b>Per&iacute;odo / obra:</b> {p.nombre ?? '-'}</p>
            {(p.desde || p.hasta) && <p><b>Fechas:</b> {fechaCorta(p.desde)} a {fechaCorta(p.hasta)}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '14px 0' }}>
              <tbody>
                {filas.map(([k, v]) => (
                  <tr key={k}><td style={celda}>{k}</td><td style={{ ...celda, textAlign: 'right' }}>{v}</td></tr>
                ))}
                <tr>
                  <td style={{ ...celda, fontWeight: 700 }}>TOTAL PAGADO</td>
                  <td style={{ ...celda, fontWeight: 700, textAlign: 'right' }}>{cop(Number(p.total ?? 0))}</td>
                </tr>
                <tr><td style={celda}>Fecha de pago</td><td style={{ ...celda, textAlign: 'right' }}>{fechaCorta(p.pagado_en)}</td></tr>
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: 32, marginTop: 56 }}>
              <div style={{ flex: 1, borderTop: '1px solid #000', paddingTop: 4 }}><b>EL EMPLEADOR</b></div>
              <div style={{ flex: 1, borderTop: '1px solid #000', paddingTop: 4 }}><b>EL TRABAJADOR</b><br />{pago.empleado ?? ''}</div>
            </div>
            <p style={{ fontSize: 12, marginTop: 24 }}>Este desprendible refleja los valores registrados en el sistema.</p>
          </div>
        )
      })}
    </>
  )
}