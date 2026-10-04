import type { CSSProperties } from 'react'
import Link from 'next/link'
import { cop } from '@/lib/format'

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
  const esDiario = String(pago.tipo_pago ?? '').toLowerCase() === 'diario'
  const caja: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', background: '#f8fafc' }
  const cajaVerde: CSSProperties = { ...caja, border: '1px solid #86efac', background: '#f0fdf4' }

  // Resumen: ultimo pago (suma de los periodos pagados en la fecha mas reciente), pendiente y total cobrado
  const todos = pago.periodos ?? []
  const pagados = todos.filter((p) => p.pagado)
  const diaPago = (p: Periodo) => String(p.pagado_en ?? '').slice(0, 10)
  const fechaUlt = pagados.map(diaPago).filter(Boolean).sort().pop() ?? ''
  const delUltimo = fechaUlt ? pagados.filter((p) => diaPago(p) === fechaUlt) : []
  const ultimo = delUltimo.reduce((a, p) => a + Number(p.total ?? 0), 0)
  const cobrado = pagados.reduce((a, p) => a + Number(p.total ?? 0), 0)
  const pendiente = todos.filter((p) => !p.pagado).reduce((a, p) => a + Number(p.total ?? 0), 0)
  // Se conserva el indice original: la pagina del desprendible lo usa para elegir el periodo
  const lista = (pago.periodos ?? []).map((p, i) => ({ p, i })).filter(({ p }) => !sinMovimiento(p))

  return (
    <div className="card" style={{ borderLeft: '4px solid #15803d' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="font-bold text-navy">Mi pago</h2>
        <Link href="/avances/desprendible" className="btn btn-o">Imprimir desprendible de pago</Link>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mb-3">
        <div style={cajaVerde}>
          <div className="text-xs text-slate-500">&Uacute;ltimo pago</div>
          <div className="text-lg font-bold">{fechaUlt ? cop(ultimo) : 'Sin pagos a\u00fan'}</div>
          {fechaUlt && (
            <div className="text-xs text-slate-500">{fechaCorta(fechaUlt)}{delUltimo.length > 1 ? ' \u00b7 ' + delUltimo.length + ' per\u00edodos' : ''}</div>
          )}
        </div>
        <div style={caja}>
          <div className="text-xs text-slate-500">Pendiente por cobrar</div>
          <div className="text-lg font-bold">{cop(pendiente)}</div>
          <div className="text-xs text-slate-500">{pendiente > 0 ? 'A\u00fan no pagado' : 'Est\u00e1s al d\u00eda'}</div>
        </div>
        <div style={caja}>
          <div className="text-xs text-slate-500">Total cobrado</div>
          <div className="text-lg font-bold">{cop(cobrado)}</div>
        </div>
        {dia > 0 && (
          <div style={caja}>
            <div className="text-xs text-slate-500">Valor por d&iacute;a</div>
            <div className="text-base font-bold">{cop(dia)}</div>
            <div className="text-xs text-slate-500">{pago.origen_valor === 'contrato' ? 'Seg\u00fan tu contrato firmado' : 'Seg\u00fan tu ficha'}</div>
          </div>
        )}
        {!esDiario && trabajo > 0 && (
          <div style={caja}>
            <div className="text-xs text-slate-500">Valor por trabajo</div>
            <div className="text-base font-bold">{cop(trabajo)}</div>
          </div>
        )}
        <div style={caja}>
          <div className="text-xs text-slate-500">Fecha de ingreso</div>
          <div className="text-base font-bold">{fechaCorta(pago.ingreso)}</div>
        </div>
      </div>
      {lista.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Per&iacute;odo</th><th>D&iacute;as</th><th>Adelantos</th><th>Descuentos</th><th>Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {lista.map(({ p, i }) => (
                <tr key={i}>
                  <td>{p.nombre ?? fechaCorta(p.desde)}</td>
                  <td>{Number(p.dias ?? 0)}</td>
                  <td>{Number(p.adelantos ?? 0) > 0 ? cop(Number(p.adelantos)) : '-'}</td>
                  <td>{Number(p.descuentos ?? 0) > 0 ? cop(Number(p.descuentos)) : '-'}</td>
                  <td>{cop(Number(p.total ?? 0))}</td>
                  <td>{p.pagado ? 'Pagado ' + fechaCorta(p.pagado_en) : 'Pendiente'}</td>
                  <td>{p.pagado ? <Link href={'/avances/desprendible?p=' + i} className="btn btn-g">Imprimir</Link> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">A&uacute;n no tienes n&oacute;minas registradas.</p>
      )}
    </div>
  )
}