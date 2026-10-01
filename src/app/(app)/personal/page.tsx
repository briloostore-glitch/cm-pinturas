import { guard } from '@/lib/guard'
import { ui } from '@/lib/ui'
import { cop, POSITIONS, PAY_TYPES } from '@/lib/money'
import ConfirmAction from '@/components/ConfirmAction'
import { createEmployee, deleteEmployee, updateEmployee } from './actions'

export default async function Personal({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await guard('personal')
  const { data: staff } = await supabase.from('employees').select('*').order('status').order('full_name')
  const sel = (name: string, list: [string, string][], v?: string) => (
    <select name={name} defaultValue={v} className={ui.inp}>{list.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
  )

  return (
    <>
      <h1 className={ui.h1 + ' mb-4'}>Personal</h1>
      {error && <div className={ui.err}>{error}</div>}
      <form action={createEmployee} className={ui.card}>
        <h2 className="font-semibold mb-3">Nuevo trabajador</h2>
        <div className={ui.grid}>
          <div><label className={ui.lbl}>Nombre *</label><input name="full_name" required className={ui.inp} /></div>
          <div><label className={ui.lbl}>Documento</label><input name="document" className={ui.inp} /></div>
          <div><label className={ui.lbl}>Teléfono</label><input name="phone" className={ui.inp} /></div>
          <div><label className={ui.lbl}>Cargo</label>{sel('position', POSITIONS, 'pintor')}</div>
          <div><label className={ui.lbl}>Tipo de pago</label>{sel('pay_type', PAY_TYPES, 'diario')}</div>
          <div><label className={ui.lbl}>Valor diario (COP)</label><input name="daily_rate" type="number" min="0" className={ui.inp} /></div>
          <div><label className={ui.lbl}>Valor por trabajo (COP)</label><input name="job_rate" type="number" min="0" className={ui.inp} /></div>
          <div><label className={ui.lbl}>Fecha de ingreso</label><input name="hired_at" type="date" className={ui.inp} /></div>
        </div>
        <button className={ui.btn}>Guardar trabajador</button>
      </form>

      <div className={ui.card + ' overflow-x-auto'}>
        {(staff ?? []).length ? (
          <table className={ui.table}>
            <thead><tr><th className={ui.th}>Trabajador</th><th className={ui.th}>Cargo y pago</th><th className={ui.th}></th></tr></thead>
            <tbody>
              {(staff ?? []).map((e) => (
                <tr key={e.id} className={e.status === 'inactivo' ? 'opacity-60' : ''}>
                  <td className={ui.td}>
                    <div className="font-medium">{e.full_name}</div>
                    <div className="text-xs text-slate-500">{e.document} {e.phone && `· ${e.phone}`}</div>
                    <div className="text-xs text-slate-500">Día: {cop(Number(e.daily_rate))} · Trabajo: {cop(Number(e.job_rate))}</div>
                  </td>
                  <td className={ui.td}>
                    <form action={updateEmployee} className="flex flex-wrap gap-2 items-center">
                      <input type="hidden" name="id" value={e.id} />
                      <div className="w-32">{sel('position', POSITIONS, e.position)}</div>
                      <div className="w-28">{sel('pay_type', PAY_TYPES, e.pay_type)}</div>
                      <input name="daily_rate" type="number" min="0" defaultValue={e.daily_rate} className={ui.inp + ' w-28'} aria-label="Valor diario" />
                      <input name="job_rate" type="number" min="0" defaultValue={e.job_rate} className={ui.inp + ' w-28'} aria-label="Valor por trabajo" />
                      <select name="status" defaultValue={e.status} className={ui.inp + ' w-28'}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select>
                      <button className={ui.btnG}>Guardar</button>
                    </form>
                  </td>
                  <td className={ui.td}>
                    <form action={deleteEmployee}>
                      <input type="hidden" name="id" value={e.id} />
                      <ConfirmAction label="Eliminar" message="¿Eliminar a este trabajador?" />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className={ui.empty}>Aún no hay trabajadores registrados.</p>}
      </div>
    </>
  )
}
