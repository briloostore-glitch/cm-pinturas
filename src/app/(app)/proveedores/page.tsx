import Link from 'next/link'
import { requireModule } from '@/lib/auth'

const wa = (n: string) => { const d = n.replace(/\D/g, ''); return 'https://wa.me/' + (d.length === 10 ? '57' + d : d) }

export default async function Proveedores() {
  const { supabase } = await requireModule('proveedores')
  const { data } = await supabase.from('suppliers').select('id,company,contact,phone,whatsapp,email,products').order('company')
  const rows = data ?? []
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-navy">Proveedores</h1>
        <Link href="/proveedores/nuevo" className="btn btn-o">Nuevo proveedor</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Empresa</th><th>Contacto</th><th>Teléfono</th><th>WhatsApp</th><th>Productos</th><th></th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.company}</td><td>{s.contact ?? '-'}</td><td>{s.phone ?? '-'}</td>
                <td>{s.whatsapp ? <a href={wa(s.whatsapp)} target="_blank" rel="noopener noreferrer" className="underline">{s.whatsapp}</a> : '-'}</td>
                <td>{s.products ?? '-'}</td>
                <td><Link href={`/proveedores/${s.id}`} className="btn btn-g">Abrir</Link></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="text-slate-500">Aún no hay proveedores.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}