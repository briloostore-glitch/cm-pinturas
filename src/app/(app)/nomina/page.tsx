import Link from 'next/link'
import { guard } from '@/lib/guard'
import { ui } from '@/lib/ui'
import { cop, fdate } from '@/lib/money'
import { createPeriod } from './actions'

export default async function Nomina({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await guard('nomina')
  const [{ data: periods }, { data: items }] = await Promise.all([
    supabase.from('payroll_periods').select('*').order('start_date', { ascending: false, nullsFirst: false }),
    supabase.from('payroll_items').select('period_id,total,paid'),
  ])
  const sums = new Map<string, { total: number; pending: number }>()
  for (const i of items ?? []) {
    const s = sums.get(i.period_id) ?? { total: 0, pending: 0 }
    s.total += Number(i.total)
    if (!i.paid) s.pending += Number(i.total)
    sums.set(i.period_id, s)
  }
  const now = new Date()
  const defName = `Nómina ${now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric', timeZone: 'America/Bogota' })}`

  return (
    <>
      <h1 className={ui.h1 + ' mb-4'}>Nómina</h1>
      {error && <div className={ui.err}>{error}</div>}
      <form action={createPeriod} className={ui.card}>
        <h2 className="font-semibold mb-3">Nuevo período de pago</h2>
        <div className={ui.grid}>
          <div><label className={ui.lbl}>Nombre *</label><input name="name" required defaultValue={defName} className={ui.inp} /></div>
          <div><label className={ui.lbl}>Desde</label><input name="start_date" type="date" className={ui.inp} /></div>
          <div><label className={ui.lbl}>Hasta</label><input name="end_date" type="date" className={ui.inp} /></div>
        </div>
        <button className={ui.btn}>Crear período</button>
        <p className="text-xs text-slate-500 mt-2">Se agregan automáticamente los trabajadores activos. El sistema solo suma lo que tú registres: no calcula prestaciones ni descuentos de ley por su cuenta.</p>
      </form>
      <div className={ui.card + ' overflow-x-auto'}>
        {(periods ?? []).length ? (
          <table className={ui.table}>
            <thead><tr><th className={ui.th}>Período</th><th className={ui.th}>Fechas</th><th className={ui.th}>Total</th><th className={ui.th}>Pendiente de pago</th><th className={ui.th}>Estado</th><th className={ui.th}></th></tr></thead>
            <tbody>
              {(periods ?? []).map((p) => {
                const s = sums.get(p.id) ?? { total: 0, pending: 0 }
                return (
                  <tr key={p.id}>
                    <td className={ui.td + ' font-medium'}>{p.name}</td>
                    <td className={ui.td}>{p.start_date ? fdate(p.start_date) : '—'} → {p.end_date ? fdate(p.end_date) : '—'}</td>
                    <td className={ui.td}>{cop(s.total)}</td><td className={ui.td}>{cop(s.pending)}</td>
                    <td className={ui.td}>{p.status}</td>
                    <td className={ui.td}><Link href={`/nomina/${p.id}`} className={ui.btnG}>Abrir</Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : <p className={ui.empty}>Aún no hay períodos de nómina.</p>}
      </div>
    </>
  )
}
