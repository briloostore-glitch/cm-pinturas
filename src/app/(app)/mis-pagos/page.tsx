import { requireModule } from '@/lib/auth'
import MiPago from '@/components/MiPago'
import type { Pago } from '@/components/MiPago'

export default async function MisPagos() {
  const { supabase } = await requireModule('mis-pagos')
  const { data } = await supabase.rpc('mi_pago')
  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-4">Mis pagos</h1>
      <MiPago pago={(data as Pago | null) ?? null} />
    </>
  )
}