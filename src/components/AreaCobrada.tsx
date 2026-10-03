'use client'

import { useEffect, useRef, useState } from 'react'
import { FACTOR_PISO } from '@/lib/area'

export default function AreaCobrada({
  pisoIds, defaultInformada, defaultCobrada,
}: { pisoIds: string[]; defaultInformada?: number; defaultCobrada?: number }) {
  const raiz = useRef<HTMLDivElement>(null)
  const [inf, setInf] = useState(defaultInformada != null ? String(defaultInformada) : '')
  const [base, setBase] = useState('')
  const [cobrada, setCobrada] = useState(defaultCobrada != null ? String(defaultCobrada) : '')
  const [sel, setSel] = useState<string[]>([])

  // lee los servicios marcados en el formulario
  useEffect(() => {
    const form = raiz.current?.closest('form')
    if (!form) return
    const leer = () => setSel(new FormData(form).getAll('services').map(String))
    leer()
    form.addEventListener('change', leer)
    return () => form.removeEventListener('change', leer)
  }, [])

  const n = Number(inf.replace(',', '.'))
  const hayOtroServicio = sel.length === 0 || sel.some((id) => !pisoIds.includes(id))
  const mostrarBoton = base === 'piso' && n > 0 && hayOtroServicio
  const estimado = Math.round(n * FACTOR_PISO)

  return (
    <>
      <div ref={raiz}>
        <label className="lbl">&Aacute;rea informada por el cliente (m&sup2;)</label>
        <input name="client_reported_area" type="number" min="1" step="0.01" value={inf} onChange={(e) => setInf(e.target.value)} className="inp" />
      </div>
      <div>
        <label className="lbl">Esa &aacute;rea corresponde a</label>
        <select name="area_basis" value={base} onChange={(e) => setBase(e.target.value)} className="inp">
          <option value="">Sin indicar</option>
          <option value="piso">Piso</option>
          <option value="superficie">Superficie</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div>
        <label className="lbl">&Aacute;rea a cobrar (m&sup2;) *</label>
        <input name="area_m2" type="number" min="1" step="0.01" required value={cobrada} onChange={(e) => setCobrada(e.target.value)} className="inp" />
        {mostrarBoton && (
          <button type="button" className="btn btn-g mt-1" onClick={() => setCobrada(String(estimado))}>
            Usar estimado: {estimado} m&sup2; ({n} &times; {FACTOR_PISO})
          </button>
        )}
      </div>
    </>
  )
}