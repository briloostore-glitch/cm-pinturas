import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { cop } from '@/lib/format'
import { nombre } from '@/lib/labels'
import { createVisit } from '../actions'

export default async function NuevaVisita({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await requireModule('visitas')
  const [{ data: clients }, st] = await Promise.all([
    supabase.from('clients').select('id,first_name,last_name,phone').order('first_name'),
    getSettings(supabase),
  ])
  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Nueva visita técnica</h1>
      {error && <div className="err">{error}</div>}
      <form action={createVisit} className="card">
        <div className="grid-f">
          <div>
            <label className="lbl">Cliente</label>
            <select name="client_id" className="inp" defaultValue="">
              <option value="" disabled>Elegir cliente</option>
              {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{nombre(c)}{c.phone ? ` - ${c.phone}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Valor de la visita</label>
            <input className="inp" value={cop(st.visit_price)} readOnly />
          </div>
        </div>
        <label className="lbl">Notas</label>
        <textarea name="notes" className="inp mb-3" rows={3} />
        <div className="flex gap-2">
          <button type="submit" className="btn">Crear visita</button>
          <Link href="/visitas" className="btn btn-g">Cancelar</Link>
        </div>
      </form>
    </>
  )
}