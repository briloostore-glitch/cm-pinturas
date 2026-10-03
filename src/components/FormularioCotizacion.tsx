'use client'

import { useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useFormStatus } from 'react-dom'
import { clasificar, GRUPOS, NIVELES } from '@/lib/servicios'
import type { InfoServicio } from '@/lib/servicios'
import { FACTOR_PISO } from '@/lib/area'

type Opcion = { id: string; label: string }
type Servicio = { id: string; name: string }
type Fila = Servicio & InfoServicio

type Props = {
  action: (fd: FormData) => void | Promise<void>
  clientes: Opcion[]
  servicios: Servicio[]
  zonas: string[]
  solicitudId?: string
  inicial: {
    clienteId?: string
    tipo?: string
    zona?: string
    direccion?: string
    humedad?: boolean
    areaInformada?: number
    marcados: string[]
  }
}

const TIPOS: [string, string][] = [
  ['casa', 'Casa'], ['apartamento', 'Apartamento'], ['local', 'Local comercial'], ['oficina', 'Oficina'], ['otro', 'Otro'],
]
const BASES: [string, string][] = [['piso', 'Piso'], ['superficie', 'Superficie'], ['otro', 'Otro']]

const th: CSSProperties = { padding: '6px 8px', textAlign: 'center', fontSize: 12, borderBottom: '1px solid #cbd5e1' }
const td: CSSProperties = { padding: '8px', borderBottom: '1px solid #e2e8f0' }
const cab = (c: string): CSSProperties => ({
  background: c, color: '#fff', fontWeight: 700, padding: '8px 12px', letterSpacing: '.04em', fontSize: 14, margin: 0,
})
const tarjeta = (c: string): CSSProperties => ({ border: '2px solid ' + c, borderRadius: 12, overflow: 'hidden', background: '#fff' })

function BotonConfirmar({ deshabilitado }: { deshabilitado: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn" disabled={deshabilitado || pending}>
      {pending ? 'Creando...' : 'Confirmar y crear cotizaci\u00f3n'}
    </button>
  )
}

export default function FormularioCotizacion({ action, clientes, servicios, zonas, solicitudId, inicial }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const filas = useMemo<Fila[]>(() => servicios.map((s) => ({ ...s, ...clasificar(s.name) })), [servicios])
  const porId = useMemo(() => new Map<string, Fila>(filas.map((f) => [f.id, f])), [filas])

  const [sel, setSel] = useState<string[]>(() => {
    let hayInterior = false
    return inicial.marcados.filter((id) => {
      const g = porId.get(id)?.grupo
      if (!g) return false
      if (g !== 'interior') return true
      if (hayInterior) return false
      hayInterior = true
      return true
    })
  })
  const [qty, setQty] = useState<Record<string, string>>({})
  const [clienteId, setClienteId] = useState(inicial.clienteId ?? '')
  const [tipo, setTipo] = useState(inicial.tipo ?? '')
  const [zona, setZona] = useState(inicial.zona ?? '')
  const [direccion, setDireccion] = useState(inicial.direccion ?? '')
  const [humedad, setHumedad] = useState(!!inicial.humedad)
  const [modo, setModo] = useState('1')
  const [inf, setInf] = useState(inicial.areaInformada != null ? String(inicial.areaInformada) : '')
  const [base, setBase] = useState('')
  const [revisando, setRevisando] = useState(false)
  const [aviso, setAviso] = useState('')

  const estaSel = (id: string) => sel.includes(id)
  const setCant = (id: string, v: string) => setQty((q) => ({ ...q, [id]: v }))

  function alternar(id: string) {
    setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
    if (porId.get(id)?.fijo) setQty((q) => (q[id] ? q : { ...q, [id]: '1' }))
  }
  function elegirInterior(id: string) {
    setSel((p) => [...p.filter((x) => porId.get(x)?.grupo !== 'interior'), id])
  }
  function quitarInterior() {
    setSel((p) => p.filter((x) => porId.get(x)?.grupo !== 'interior'))
  }

  const infN = Number(inf.replace(',', '.'))

  function campoCantidad(f: Fila) {
    const sugerido: number | null =
      f.unidad === 'm\u00b2 de paredes y techo' && base === 'piso' && infN > 0
        ? Math.round(infN * FACTOR_PISO)
        : f.porPiso && infN > 0
          ? infN
          : null
    return (
      <div className="mt-2">
        <label className="lbl">Cantidad ({f.unidad}) *</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            name={'qty_' + f.id} type="number" min="0.01" step="0.01" required
            value={qty[f.id] ?? ''} onChange={(e) => setCant(f.id, e.target.value)}
            className="inp" style={{ maxWidth: 160 }}
          />
          {sugerido != null && (
            <button type="button" className="btn btn-g" onClick={() => setCant(f.id, String(sugerido))}>
              {f.porPiso ? 'Usar el \u00e1rea informada' : 'Usar estimado'}: {sugerido} m&sup2;
            </button>
          )}
        </div>
      </div>
    )
  }

  function revisar() {
    setAviso('')
    const form = formRef.current
    if (!form) return
    if (!sel.length) {
      setAviso('Marca al menos un servicio.')
      return
    }
    if (!form.reportValidity()) return
    setRevisando(true)
  }

  const gi = GRUPOS.find((g) => g.id === 'interior') ?? GRUPOS[0]
  const interiores = filas.filter((f) => f.grupo === 'interior')
  const celda = (nivel: number, porPiso: boolean) => interiores.find((f) => f.nivel === nivel && f.porPiso === porPiso)
  const enMatriz = new Set<string>()
  NIVELES.forEach((n) => [false, true].forEach((p) => { const f = celda(n.nivel, p); if (f) enMatriz.add(f.id) }))
  const extrasInterior = interiores.filter((f) => !enMatriz.has(f.id))
  const interiorSel = sel.map((id) => porId.get(id)).find((f) => f?.grupo === 'interior')

  const lineas = sel.map((id) => porId.get(id)).filter((f): f is Fila => !!f)
  const nInterior = lineas.filter((f) => f.grupo === 'interior').length
  const infSinBase = inf.trim() !== '' && base === ''
  const baseSinInf = base !== '' && inf.trim() === ''
  const bloqueado = nInterior > 1 || infSinBase || baseSinInf
  const nombreCliente = clientes.find((c) => c.id === clienteId)?.label ?? '-'
  const nombreTipo = TIPOS.find((t) => t[0] === tipo)?.[1] ?? '-'
  const colorDe = (f: Fila) => GRUPOS.find((g) => g.id === f.grupo)?.color ?? '#475569'

  return (
    <form ref={formRef} action={action} className="card">
      {solicitudId && <input type="hidden" name="solicitud" value={solicitudId} />}

      <div className="grid-f">
        <div>
          <label className="lbl">Cliente *</label>
          <select name="client_id" required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="inp">
            <option value="">Selecciona...</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl">Tipo de inmueble *</label>
          <select name="kind" required value={tipo} onChange={(e) => setTipo(e.target.value)} className="inp">
            <option value="">Selecciona...</option>
            {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl">Zona *</label>
          <select name="city" required value={zona} onChange={(e) => setZona(e.target.value)} className="inp">
            <option value="">Selecciona...</option>
            {zonas.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl">Direcci&oacute;n de la obra</label>
          <input name="address" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="inp" />
        </div>
        <div>
          <label className="lbl">&Aacute;rea informada por el cliente (m&sup2;), opcional</label>
          <input name="client_reported_area" type="number" min="1" step="0.01" value={inf} onChange={(e) => setInf(e.target.value)} className="inp" />
        </div>
        <div>
          <label className="lbl">Esa &aacute;rea corresponde a</label>
          <select name="area_basis" value={base} onChange={(e) => setBase(e.target.value)} className="inp">
            <option value="">Sin indicar</option>
            {BASES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <label className="lbl">Servicios *</label>
      <div className="space-y-3 mb-3">
        {interiores.length > 0 && (
          <section style={tarjeta(gi.color)}>
            <h3 style={cab(gi.color)}>{gi.titulo}</h3>
            <div style={{ padding: 10 }}>
              <p className="text-xs mb-2" style={{ color: '#475569' }}>Elige una sola opci&oacute;n.</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                  <thead>
                    <tr>
                      <th style={th}></th>
                      <th style={th}>Por m&sup2; medidos (paredes + techo)</th>
                      <th style={th}>Apartamento: por m&sup2; de piso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NIVELES.map((n) => (
                      <tr key={n.nivel}>
                        <td style={{ ...td, fontWeight: 700 }}>{n.titulo}</td>
                        {[false, true].map((p) => {
                          const f = celda(n.nivel, p)
                          return (
                            <td key={String(p)} style={{ ...td, textAlign: 'center', background: f && estaSel(f.id) ? gi.suave : undefined }}>
                              {f ? (
                                <input
                                  type="radio" name="interior" value={f.id} aria-label={f.name}
                                  checked={estaSel(f.id)} onChange={() => elegirInterior(f.id)}
                                />
                              ) : (
                                <span style={{ color: '#94a3b8' }}>&mdash;</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {extrasInterior.length > 0 && (
                <div className="mt-2 space-y-1">
                  {extrasInterior.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 text-sm">
                      <input type="radio" name="interior" value={f.id} checked={estaSel(f.id)} onChange={() => elegirInterior(f.id)} /> {f.name}
                    </label>
                  ))}
                </div>
              )}
              {interiorSel && (
                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: gi.suave, border: '1px solid ' + gi.color }}>
                  <b className="text-sm">{interiorSel.name}</b>
                  {campoCantidad(interiorSel)}
                  <button type="button" className="btn btn-g mt-2" onClick={quitarInterior}>Quitar selecci&oacute;n</button>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {GRUPOS.filter((g) => g.id !== 'interior').map((g) => {
            const lista = filas.filter((f) => f.grupo === g.id)
            if (!lista.length) return null
            return (
              <section key={g.id} style={tarjeta(g.color)}>
                <h3 style={cab(g.color)}>{g.titulo}</h3>
                <div style={{ padding: 10 }} className="space-y-2">
                  {lista.map((f) => {
                    const on = estaSel(f.id)
                    return (
                      <div key={f.id} style={{ border: '1px solid ' + (on ? g.color : '#e2e8f0'), background: on ? g.suave : '#fff', borderRadius: 8, padding: '8px 10px' }}>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="services" value={f.id} checked={on} onChange={() => alternar(f.id)} /> {f.name}
                        </label>
                        {on && campoCantidad(f)}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <label className="flex items-center gap-2"><input type="radio" name="mode" value="1" checked={modo === '1'} onChange={() => setModo('1')} /> Mano de obra + materiales</label>
        <label className="flex items-center gap-2"><input type="radio" name="mode" value="2" checked={modo === '2'} onChange={() => setModo('2')} /> Solo mano de obra (materiales del cliente)</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="has_humidity" checked={humedad} onChange={(e) => setHumedad(e.target.checked)} /> Tiene humedad</label>
      </div>

      {aviso && <div className="err">{aviso}</div>}

      {!revisando ? (
        <button type="button" className="btn btn-o" onClick={revisar}>Revisar y crear cotizaci&oacute;n</button>
      ) : (
        <div id="resumen-cotizacion" style={{ border: '2px solid #1e3a8a', borderRadius: 12, padding: 12, background: '#f8fafc' }}>
          <h3 className="font-bold text-navy mb-2">Resumen antes de crear</h3>
          <p className="text-sm"><b>Cliente:</b> {nombreCliente}</p>
          <p className="text-sm"><b>Tipo de inmueble:</b> {nombreTipo} &middot; <b>Zona:</b> {zona || '-'}{direccion ? ' \u00b7 ' + direccion : ''}</p>
          <p className="text-sm mb-2"><b>Modalidad:</b> {modo === '1' ? 'Mano de obra + materiales' : 'Solo mano de obra'}{humedad ? ' \u00b7 con humedad' : ''}{inf.trim() !== '' ? ' \u00b7 \u00e1rea informada: ' + inf + ' m\u00b2 (' + (BASES.find((b) => b[0] === base)?.[1] ?? '-') + ')' : ''}</p>
          <ul className="space-y-1 mb-3">
            {lineas.map((f) => (
              <li key={f.id} className="text-sm" style={{ borderLeft: '4px solid ' + colorDe(f), paddingLeft: 8 }}>
                {f.name}: <b>{qty[f.id] || '?'} {f.unidad}</b>
              </li>
            ))}
          </ul>
          {nInterior > 1 && <div className="err">Hay dos servicios de pintura interior. Deja solo uno.</div>}
          {infSinBase && <div className="err">Indica a qu&eacute; corresponde el &aacute;rea informada (piso, superficie u otro).</div>}
          {baseSinInf && <div className="err">Escribe el &aacute;rea informada por el cliente o quita lo que corresponde.</div>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-g" onClick={() => setRevisando(false)}>Volver a editar</button>
            <BotonConfirmar deshabilitado={bloqueado} />
          </div>
        </div>
      )}
    </form>
  )
}