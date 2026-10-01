import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import SupplierFields from '@/components/SupplierFields'
import { createSupplier } from '../actions'

export default async function NuevoProveedor({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  await requireModule('proveedores')
  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Nuevo proveedor</h1>
      {error && <div className="err">{error}</div>}
      <form action={createSupplier} className="card">
        <SupplierFields />
        <div className="flex gap-2">
          <button type="submit" className="btn">Crear proveedor</button>
          <Link href="/proveedores" className="btn btn-g">Cancelar</Link>
        </div>
      </form>
    </>
  )
}