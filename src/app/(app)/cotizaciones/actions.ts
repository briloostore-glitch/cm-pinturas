'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { toMsg } from '@/lib/format'
import { getSettings } from '@/lib/settings'

const back = (m: string): never => redirect('/cotizaciones/nueva?error=' + toMsg(m))

// Los precios se leen de la base de datos y se recalculan en el servidor: nunca del navegador.
export async function createQuote(fd: FormData) {
  const { supabase, profile } = await requireModule('cotizaciones')
  const clientId = String(fd.get('client_id') ?? '')
  const mode = Number(fd.get('mode')) === 2 ? 2 : 1
  const area = Number(fd.get('area_m2'))
  const city = String(fd.get('city') ?? '')
  const ids = fd.getAll('services').map(String)
  if (!clientId || !(area > 0) || !ids.length) back('Elige un cliente, indica los m² y marca al menos un servicio')

  const st = await getSettings(supabase)
  const [{ data: zone }, { data: svcs }] = await Promise.all([
    supabase.from('zones').select('*').eq('name', city).single(),
    supabase.from('services').select('*').in('id', ids),
  ])
  if (!zone || !svcs?.length) back('No se encontró la zona o los servicios elegidos')

  const { data: prop } = await supabase.from('properties').insert({
    client_id: clientId, kind: String(fd.get('kind') || 'casa'), address: String(fd.get('address') ?? '').trim() || null,
    city, area_m2: area, has_humidity: fd.get('has_humidity') === 'on',
  }).select('id').single()

  const { data: q, error } = await supabase.from('quotes').insert({
    client_id: clientId, property_id: prop?.id ?? null, mode, city, area_m2: area,
    zone_percent: zone!.labor_percent, transport: zone!.transport, other_costs: st.other_costs,
    margin_percent: st.margin_percent, tax_percent: st.tax_percent, valid_days: st.quote_validity_days, created_by: profile.id,
  }).select('id').single()
  if (error || !q) back('No se pudo crear la cotización: ' + (error?.message ?? ''))

  await supabase.from('quote_items').insert(
    svcs!.map((s) => ({
      quote_id: q!.id, service_id: s.id,
      description: s.name + (mode === 1 ? ', mano de obra y materiales' : ', solo mano de obra'),
      unit: 'm²', qty: area,
      labor_unit: Math.round((Number(s.labor_per_m2) * Number(zone!.labor_percent)) / 100),
      material_unit: mode === 1 ? Number(s.material_per_m2) : 0,
    }))
  )
  const solId = String(fd.get('solicitud') ?? '')
  if (solId) {
    await supabase.from('requests').update({ status: 'convertida', client_id: clientId }).eq('id', solId).eq('status', 'nueva')
  }
  redirect(`/cotizaciones/${q!.id}`)
}

export async function approveQuote(fd: FormData) {
  const { supabase } = await requireModule('cotizaciones')
  const id = String(fd.get('id'))
  await supabase.rpc('approve_quote', { qid: id })
  revalidatePath(`/cotizaciones/${id}`)
}

export async function rejectQuote(fd: FormData) {
  const { supabase } = await requireModule('cotizaciones')
  const id = String(fd.get('id'))
  await supabase.rpc('reject_quote', { qid: id })
  revalidatePath(`/cotizaciones/${id}`)
}

const falla = (ruta: string, m: string): never => redirect(ruta + '?error=' + toMsg(m))

// Elimina una cotizacion. Solo administrador. No se borra si ya tiene trabajo, factura o visita ligada.
export async function deleteQuote(fd: FormData) {
  const { supabase, profile } = await requireModule('cotizaciones')
  const id = String(fd.get('id') ?? '')
  const ruta = String(fd.get('from') ?? '') === 'detalle' ? '/cotizaciones/' + id : '/cotizaciones'
  if (!id) falla('/cotizaciones', 'Cotizacion no valida')

  const { data: rol } = await supabase.rpc('app_role')
  const esAdmin = rol === 'administrador' || (profile as unknown as { role?: string }).role === 'administrador'
  if (!esAdmin) falla(ruta, 'Solo el administrador puede eliminar cotizaciones')

  const [obras, facturas, visitas] = await Promise.all([
    supabase.from('work_orders').select('id', { count: 'exact', head: true }).eq('quote_id', id),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('quote_id', id),
    supabase.from('visits').select('id', { count: 'exact', head: true }).eq('credit_quote_id', id),
  ])
  if ((obras.count ?? 0) > 0) falla(ruta, 'No se puede eliminar: ya tiene un trabajo creado. Dejala como rechazada.')
  if ((facturas.count ?? 0) > 0) falla(ruta, 'No se puede eliminar: ya tiene una factura. Dejala como rechazada.')
  if ((visitas.count ?? 0) > 0) falla(ruta, 'No se puede eliminar: una visita tecnica usa esta cotizacion como credito.')

  const { data, error } = await supabase.from('quotes').delete().eq('id', id).select('id')
  if (error) {
    falla(ruta, error.code === '23503'
      ? 'No se puede eliminar: tiene trabajo, factura o visita ligada. Dejala como rechazada.'
      : 'No se pudo eliminar: ' + error.message)
  }
  if (!data || !data.length) falla(ruta, 'No se pudo eliminar: sin permiso o ya no existe')
  revalidatePath('/cotizaciones')
  redirect('/cotizaciones')
}
