import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import MaterialFields from '@/components/MaterialFields'
import { createMaterial } from '../actions'

export default async function NuevoMaterial({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await requireModule('inventario')
  const { data: provs } = await supabase.from('suppliers').select('id,company').order('company')
  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Nuevo material</h1>
      {error && <div className="err">{error}</div>}
      <form action={createMaterial} className="card">
        <MaterialFields suppliers={provs ?? []} nuevo />
        <div className="flex gap-2">
          <button type="submit" className="btn">Crear material</button>
          <Link href="/inventario" className="btn btn-g">Cancelar</Link>
        </div>
      </form>
    </>
  )
}