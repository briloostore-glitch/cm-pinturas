import Link from 'next/link'
import { guard } from '@/lib/guard'
import { ui } from '@/lib/ui'
import { fdate } from '@/lib/money'
import FacturacionTabs from '@/components/FacturacionTabs'
import { createLetter } from './actions'

type Q = { id: string; seq: number; area_m2: number; clients: { first_name: string; last_name: string | null } | null }

export default async function Cartas({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await guard('facturacion')
  const [{ data: letters }, { data: q }] = await Promise.all([
    supabase.from('letters').select('id,seq,letter_date,recipient,subject').order('seq', { ascending: false }).limit(200),
    supabase.from('quotes').select('id,seq,area_m2,clients(first_name,last_name)').order('seq', { ascending: false }).limit(100),
  ])
  const quotes = (q ?? []) as unknown as Q[]

  return (
    <>
      <FacturacionTabs active="cartas" />
      <h1 className={ui.h1 + ' mb-4'}>Cartas de presentación</h1>
      {error && <div className={ui.err}>{error}</div>}
      <form action={createLetter} className={ui.card}>
        <h2 className="font-semibold mb-3">Nueva carta con membrete</h2>
        <div className={ui.grid}>
          <div>
            <label className={ui.lbl}>Desde una cotización (llena cliente, inmueble y texto)</label>
            <select name="quote_id" className={ui.inp}>
              <option value="">— Carta en blanco —</option>
              {quotes.map((x) => <option key={x.id} value={x.id}>COT-{String(x.seq).padStart(3, '0')} · {x.clients?.first_name} {x.clients?.last_name} · {x.area_m2} m²</option>)}
            </select>
          </div>
        </div>
        <button className={ui.btn}>Crear y editar</button>
      </form>
      <div className={ui.card + ' overflow-x-auto'}>
        {(letters ?? []).length ? (
          <table className={ui.table}>
            <thead><tr><th className={ui.th}>N.º</th><th className={ui.th}>Fecha</th><th className={ui.th}>Para</th><th className={ui.th}>Asunto</th><th className={ui.th}></th></tr></thead>
            <tbody>
              {(letters ?? []).map((l) => (
                <tr key={l.id}>
                  <td className={ui.td}>{String(l.seq).padStart(3, '0')}</td><td className={ui.td}>{fdate(l.letter_date)}</td>
                  <td className={ui.td}>{l.recipient}</td><td className={ui.td}>{(l.subject ?? '').replace(/\*\*/g, '')}</td>
                  <td className={ui.td}><Link href={`/facturacion/cartas/${l.id}`} className={ui.btnG}>Editar / imprimir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className={ui.empty}>Aún no hay cartas.</p>}
      </div>
    </>
  )
}
