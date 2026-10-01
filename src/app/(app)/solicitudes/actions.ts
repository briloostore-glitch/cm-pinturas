'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { toMsg } from '@/lib/format'
import { getSettings } from '@/lib/settings'

function back(m: string): never {
  return redirect('/solicitudes?error=' + toMsg(m))
}

export async function convertRequest(fd: FormData) {
  const { supabase } = await requireModule('solicitudes')
  const id = String(fd.get('id') ?? '')
  const { data: r } = await supabase.from('requests').select('*').eq('id', id).single()
  if (!r || r.status !== 'nueva') back('La solicitud ya no esta disponible')

  const parts = String(r.nombre ?? '').trim().split(/\s+/)
  const first = parts.shift() || 'Cliente'
  const last = parts.join(' ') || null
  const city = r.ciudad === 'Otra' ? r.ciudad_otra : r.ciudad

  const { data: cl, error: ce } = await supabase.from('clients').insert({
    first_name: first, last_name: last, phone: r.celular || null, whatsapp: r.celular || null,
    email: r.correo || null, address: r.direccion || null, city: city || null,
  }).select('id').single()
  if (ce || !cl) back('No se pudo crear el cliente: ' + (ce?.message ?? ''))

  const avisos: string[] = []
  const kind = String((r.tipo_inmueble === 'Otro' ? r.tipo_otro : r.tipo_inmueble) || 'casa').toLowerCase()
  const { error: pe } = await supabase.from('properties').insert({
    client_id: cl.id, kind, address: r.direccion || null, city: city || null,
    area_m2: r.area_m2, has_humidity: !!r.humedad,
  })
  if (pe) avisos.push('inmueble no guardado: ' + pe.message)

  let visitId: string | null = null
  if (r.visita_diagnostico) {
    const st = await getSettings(supabase)
    const fotos = Array.isArray(r.fotos) && r.fotos.length ? ' Fotos: ' + r.fotos.join(' ') : ''
    const notes = 'Solicitud web: ' + [
      r.servicio, kind, r.area_m2 != null ? r.area_m2 + ' m2' : null,
      r.humedad ? 'con humedad' : null, r.direccion, r.mensaje,
    ].filter(Boolean).join(' | ') + fotos
    const { data: v, error: ve } = await supabase.from('visits').insert({
      client_id: cl.id, status: 'pago_pendiente', price: st.visit_price, notes,
    }).select('id').single()
    if (ve || !v) avisos.push('visita no creada: ' + (ve?.message ?? ''))
    else visitId = String(v.id)
  }

  await supabase.from('requests').update({
    status: 'convertida', client_id: String(cl.id), visit_id: visitId,
  }).eq('id', id)
  revalidatePath('/solicitudes')
  revalidatePath('/clientes')
  revalidatePath('/visitas')
  if (avisos.length) back('Cliente creado. Avisos: ' + avisos.join('; '))
  redirect(visitId ? '/visitas/' + visitId : '/clientes')
}

export async function discardRequest(fd: FormData) {
  const { supabase } = await requireModule('solicitudes')
  await supabase.from('requests').update({ status: 'descartada' })
    .eq('id', String(fd.get('id') ?? '')).eq('status', 'nueva')
  revalidatePath('/solicitudes')
}

export async function deleteRequest(fd: FormData) {
  const { supabase } = await requireModule('solicitudes')
  const id = String(fd.get('id') ?? '')
  if (!id) back('Solicitud no valida')
  const { data, error } = await supabase.from('requests').delete().eq('id', id).select('id')
  if (error) back('No se pudo eliminar: ' + error.message)
  if (!data || !data.length) back('No se pudo eliminar: sin permiso o ya no existe')
  revalidatePath('/solicitudes')
}