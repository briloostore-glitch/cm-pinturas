'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { toMsg } from '@/lib/format'

const ESTADOS = ['pendiente', 'programado', 'en_ejecucion', 'pausado', 'terminado', 'cancelado']

function fail(id: string, m: string): never { return redirect(`/trabajos/${id}?error=` + toMsg(m)) }
const num = (fd: FormData, k: string) => { const n = Number(fd.get(k)); return n >= 0 ? n : 0 }
const fecha = (fd: FormData, k: string) => String(fd.get(k) ?? '') || null

export async function createWorkOrder(fd: FormData) {
  const { supabase } = await requireModule('trabajos')
  const quoteId = String(fd.get('quote_id') ?? '')
  function nueva(m: string): never { return redirect('/trabajos/nuevo?error=' + toMsg(m)) }
  if (!quoteId) nueva('Elige una cotización aprobada')
  const { data: q } = await supabase.from('quotes').select('id,client_id,total,status').eq('id', quoteId).single()
  if (!q) nueva('No se encontró la cotización')
  if (q.status !== 'aprobada') nueva('La cotización debe estar aprobada')
  const { data: ya } = await supabase.from('work_orders').select('id').eq('quote_id', quoteId).limit(1)
  if (ya?.length) nueva('Esa cotización ya tiene un trabajo')
  const crew = String(fd.get('crew_id') ?? '') || null
  const { data, error } = await supabase.from('work_orders').insert({
    quote_id: q.id, client_id: q.client_id, crew_id: crew, sale_total: q.total, status: 'pendiente',
  }).select('id').single()
  if (error || !data) nueva('No se pudo crear el trabajo: ' + (error?.message ?? ''))
  redirect(`/trabajos/${data.id}`)
}

export async function updateWorkOrder(fd: FormData) {
  const { supabase } = await requireModule('trabajos')
  const id = String(fd.get('id'))
  const status = String(fd.get('status') ?? '')
  if (!ESTADOS.includes(status)) fail(id, 'Estado no válido')
  const start = fecha(fd, 'start_date'), end = fecha(fd, 'end_date')
  if (start && end && end < start) fail(id, 'La fecha de fin no puede ser anterior a la de inicio')
  const { error } = await supabase.from('work_orders').update({
    status, start_date: start, end_date: end, crew_id: String(fd.get('crew_id') ?? '') || null,
  }).eq('id', id)
  if (error) fail(id, 'No se pudo guardar: ' + error.message)
  revalidatePath(`/trabajos/${id}`)
  redirect(`/trabajos/${id}`)
}

export async function saveCosts(fd: FormData) {
  const { supabase } = await requireModule('trabajos')
  const id = String(fd.get('id'))
  const { error } = await supabase.from('work_orders').update({
    cost_materials: num(fd, 'cost_materials'), cost_labor: num(fd, 'cost_labor'),
    cost_transport: num(fd, 'cost_transport'), cost_other: num(fd, 'cost_other'),
  }).eq('id', id)
  if (error) fail(id, 'No se pudieron guardar los costos: ' + error.message)
  revalidatePath(`/trabajos/${id}`)
  redirect(`/trabajos/${id}`)
}