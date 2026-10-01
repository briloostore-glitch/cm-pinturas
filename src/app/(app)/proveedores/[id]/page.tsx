import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import SupplierFields from '@/components/SupplierFields'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import { updateSupplier, deleteSupplier } from '../actions'

export default async function ProveedorDetalle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  const { supabase } = await requireModule('proveedores')
  const { data: s } = await supabase.from('suppliers').select('*').eq('id', id).single()
  if (!s) notFound()
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-navy">{s.company}</h1>
        <Link href="/proveedores" className="btn btn-g">Volver</Link>
      </div>
      {error && <div className="err">{error}</div>}
      <form action={updateSupplier} className="card">
        <input type="hidden" name="id" value={s.id} />
        <SupplierFields s={s} />
        <button type="submit" className="btn">Guardar</button>
      </form>
      <form action={deleteSupplier}>
        <input type="hidden" name="id" value={s.id} />
        <ConfirmSubmit label="Eliminar proveedor" message="¿Eliminar este proveedor? Esta acción no se puede deshacer." />
      </form>
    </>
  )
}