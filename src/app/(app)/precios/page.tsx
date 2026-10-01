import { requireModule } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { updateCompany, updateService, updateSettings, updateZone } from './actions'

export default async function Precios() {
  const { supabase } = await requireModule('precios')
  const [st, { data: services }, { data: zones }] = await Promise.all([
    getSettings(supabase),
    supabase.from('services').select('*').order('name'),
    supabase.from('zones').select('*').order('name'),
  ])
  const T = st.quote_terms, C = st.company

  return (
    <>
      <h1 className="text-2xl font-bold text-navy">Configuración de precios</h1>
      <p className="text-slate-500 mb-5">Todo se modifica aquí. Las cotizaciones ya creadas conservan los precios con los que se hicieron.</p>

      <form action={updateSettings} className="card">
        <h2 className="font-semibold mb-3">Valores generales</h2>
        <div className="grid-f">
          <div><label className="lbl">Visita técnica y diagnóstico (COP)</label><input name="visit_price" type="number" defaultValue={st.visit_price} className="inp" /></div>
          <div><label className="lbl">Margen de utilidad (%)</label><input name="margin_percent" type="number" step="0.01" defaultValue={st.margin_percent} className="inp" /></div>
          <div><label className="lbl">Otros costos por cotización (COP)</label><input name="other_costs" type="number" defaultValue={st.other_costs} className="inp" /></div>
          <div><label className="lbl">IVA (%)</label><input name="tax_percent" type="number" step="0.01" defaultValue={st.tax_percent} className="inp" /></div>
          <div><label className="lbl">Anticipo (%)</label><input name="deposit_percent" type="number" step="0.01" defaultValue={st.deposit_percent} className="inp" /></div>
          <div><label className="lbl">Validez de la cotización (días)</label><input name="quote_validity_days" type="number" defaultValue={st.quote_validity_days} className="inp" /></div>
        </div>
        <button className="btn">Guardar valores generales</button>
      </form>

      <div className="card overflow-x-auto">
        <h2 className="font-semibold mb-3">Tarifas por m² (COP)</h2>
        <table className="tbl">
          <thead><tr><th>Servicio</th><th>Mano de obra</th><th>Materiales</th><th></th></tr></thead>
          <tbody>
            {(services ?? []).map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td colSpan={3}>
                  <form action={updateService} className="flex gap-3 items-center">
                    <input type="hidden" name="id" value={s.id} />
                    <input name="labor" type="number" defaultValue={s.labor_per_m2} className="inp max-w-36" />
                    <input name="material" type="number" defaultValue={s.material_per_m2} className="inp max-w-36" />
                    <button className="btn btn-g">Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-semibold mb-1">Zonas</h2>
        <p className="text-sm text-slate-500 mb-3">120 en mano de obra significa 20% más cara que la tarifa base (por ejemplo en Pinares o Cerritos). Los materiales no cambian por zona.</p>
        <table className="tbl">
          <thead><tr><th>Zona</th><th>Mano de obra (% de la tarifa)</th><th>Transporte (COP)</th><th></th></tr></thead>
          <tbody>
            {(zones ?? []).map((z) => (
              <tr key={z.name}>
                <td>{z.name}</td>
                <td colSpan={3}>
                  <form action={updateZone} className="flex gap-3 items-center">
                    <input type="hidden" name="name" value={z.name} />
                    <input name="labor_percent" type="number" step="0.01" defaultValue={z.labor_percent} className="inp max-w-36" />
                    <input name="transport" type="number" defaultValue={z.transport} className="inp max-w-36" />
                    <button className="btn btn-g">Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={updateCompany} className="card">
        <h2 className="font-semibold mb-3">Datos y condiciones de la cotización impresa</h2>
        <div className="grid-f">
          <div><label className="lbl">Empresa</label><input name="name" defaultValue={C.name} className="inp" /></div>
          <div><label className="lbl">Responsable</label><input name="owner" defaultValue={C.owner} className="inp" /></div>
          <div><label className="lbl">NIT</label><input name="nit" defaultValue={C.nit} className="inp" /></div>
          <div><label className="lbl">Contacto (WhatsApp y correo)</label><input name="contact" defaultValue={C.contact} className="inp" /></div>
          <div><label className="lbl">Ubicación</label><input name="location" defaultValue={C.location} className="inp" /></div>
        </div>
        {([['includes', 'Incluye', T.includes], ['excludes', 'No incluye', T.excludes], ['payment', 'Pago', T.payment], ['time', 'Tiempo', T.time], ['warranty', 'Garantía', T.warranty], ['footer', 'Mensaje del pie', T.footer]] as const).map(([k, l, v]) => (
          <div key={k} className="mb-3"><label className="lbl">{l}</label><input name={k} defaultValue={v} className="inp" /></div>
        ))}
        <button className="btn">Guardar datos de la cotización</button>
      </form>
    </>
  )
}