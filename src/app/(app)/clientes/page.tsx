import { requireModule } from '@/lib/auth'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import { createClientRow, deleteClientRow } from './actions'

export default async function Clientes({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  const { q, error } = await searchParams
  const { supabase } = await requireModule('clientes')
  const [{ data: zones }] = await Promise.all([supabase.from('zones').select('name').order('name')])

  let query = supabase.from('clients').select('id,first_name,last_name,document,phone,city,client_type,created_at').order('created_at', { ascending: false }).limit(200)
  const term = (q ?? '').replace(/[,()%*]/g, '').trim()
  if (term) query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%,document.ilike.%${term}%`)
  const { data: clients } = await query

  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Clientes</h1>
      {error && <div className="err">{error}</div>}
      <form action={createClientRow} className="card">
        <h2 className="font-semibold mb-3">Nuevo cliente</h2>
        <div className="grid-f">
          <div><label className="lbl">Nombre *</label><input name="first_name" required className="inp" /></div>
          <div><label className="lbl">Apellido</label><input name="last_name" className="inp" /></div>
          <div><label className="lbl">NIT / C.C.</label><input name="document" className="inp" /></div>
          <div><label className="lbl">Teléfono</label><input name="phone" className="inp" /></div>
          <div><label className="lbl">WhatsApp</label><input name="whatsapp" className="inp" /></div>
          <div><label className="lbl">Correo</label><input name="email" type="email" className="inp" /></div>
          <div><label className="lbl">Dirección</label><input name="address" className="inp" /></div>
          <div>
            <label className="lbl">Ciudad / zona</label>
            <select name="city" className="inp">{(zones ?? []).map((z) => <option key={z.name}>{z.name}</option>)}</select>
          </div>
          <div>
            <label className="lbl">Tipo de cliente</label>
            <select name="client_type" className="inp"><option>Particular</option><option>Empresa</option><option>Inmobiliaria</option></select>
          </div>
        </div>
        <button className="btn">Guardar cliente</button>
      </form>

      <form className="flex gap-2 mb-3" method="get">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, teléfono o documento" className="inp max-w-sm" />
        <button className="btn btn-g">Buscar</button>
      </form>
      <div className="card overflow-x-auto">
        {(clients ?? []).length ? (
          <table className="tbl">
            <thead><tr><th>Nombre</th><th>Documento</th><th>Teléfono</th><th>Ciudad</th><th>Tipo</th><th></th></tr></thead>
            <tbody>
              {(clients ?? []).map((c) => (
                <tr key={c.id}>
                  <td>{c.first_name} {c.last_name}</td><td>{c.document}</td><td>{c.phone}</td><td>{c.city}</td><td>{c.client_type}</td>
                  <td>
                    <form action={deleteClientRow}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmSubmit label="Eliminar" message="¿Eliminar este cliente?" />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-center text-slate-500 p-4">No hay clientes{term ? ' con esa búsqueda' : ' todavía'}.</p>}
      </div>
    </>
  )
}