'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { toMsg } from '@/lib/format'

const RUTA = '/contratos'
const BUCKET = 'contratos'
const MAX_BYTES = 1000000

const t = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

function volver(ruta: string, m: string): never {
  return redirect(ruta + '?error=' + toMsg(m))
}

export async function createContract(fd: FormData) {
  const { supabase, profile } = await requireModule('contratos')
  const employee_id = t(fd, 'employee_id')
  const objeto = t(fd, 'object')
  const rate = Number(t(fd, 'daily_rate'))
  const start = t(fd, 'start_date')
  const end = t(fd, 'end_date')
  if (!employee_id) volver(RUTA, 'Elige el trabajador')
  if (!objeto) volver(RUTA, 'Escribe el trabajo a realizar')
  if (!Number.isFinite(rate) || rate <= 0) volver(RUTA, 'El valor por dia debe ser mayor a cero')
  if (!start) volver(RUTA, 'Elige la fecha de inicio')
  if (end && end < start) volver(RUTA, 'La fecha final no puede ser anterior a la de inicio')
  const { data, error } = await supabase.from('work_contracts').insert({
    employee_id,
    work_order_id: t(fd, 'work_order_id') || null,
    object: objeto,
    daily_rate: rate,
    start_date: start,
    end_date: end || null,
    notes: t(fd, 'notes') || null,
    created_by: (profile as unknown as { id?: string }).id ?? null,
  }).select('id').single()
  if (error || !data) volver(RUTA, 'No se pudo crear el contrato: ' + (error?.message ?? ''))
  revalidatePath(RUTA)
  redirect(RUTA + '/' + data.id)
}

export async function uploadSigned(fd: FormData) {
  const { supabase } = await requireModule('contratos')
  const id = t(fd, 'id')
  if (!id) volver(RUTA, 'Contrato no valido')
  const ruta = RUTA + '/' + id
  const f = fd.get('file')
  if (!(f instanceof File) || f.size === 0) volver(ruta, 'Elige la copia firmada (foto o PDF)')
  if (f.size > MAX_BYTES) volver(ruta, 'El archivo pesa mas de 1 MB. Toma una foto o reduce el PDF.')
  const ext = f.type === 'application/pdf' ? 'pdf' : f.type === 'image/png' ? 'png' : f.type === 'image/jpeg' ? 'jpg' : ''
  if (!ext) volver(ruta, 'Formato no permitido. Usa PDF, JPG o PNG.')

  const { data: c } = await supabase.from('work_contracts').select('status,signed_path').eq('id', id).single()
  if (!c || c.status !== 'borrador') volver(ruta, 'Solo se puede subir la copia mientras el contrato es borrador')

  const path = id + '/' + Date.now() + '.' + ext
  const { error: eu } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type, upsert: false })
  if (eu) volver(ruta, 'No se pudo subir la copia: ' + eu.message)

  const { error: ed } = await supabase.from('work_contracts').update({ signed_path: path }).eq('id', id)
  if (ed) {
    await supabase.storage.from(BUCKET).remove([path])
    volver(ruta, 'No se pudo guardar la copia: ' + ed.message)
  }
  if (c.signed_path) await supabase.storage.from(BUCKET).remove([c.signed_path])
  revalidatePath(ruta)
  redirect(ruta)
}

export async function firmContract(fd: FormData) {
  const { supabase } = await requireModule('contratos')
  const id = t(fd, 'id')
  const ruta = RUTA + '/' + id
  const { error } = await supabase.from('work_contracts').update({ status: 'firmado' }).eq('id', id).eq('status', 'borrador')
  if (error) volver(ruta, error.message)
  revalidatePath(ruta)
  revalidatePath(RUTA)
  redirect(ruta)
}

export async function annulContract(fd: FormData) {
  const { supabase } = await requireModule('contratos')
  const id = t(fd, 'id')
  const ruta = RUTA + '/' + id
  const { error } = await supabase.from('work_contracts').update({ status: 'anulado' }).eq('id', id).in('status', ['borrador', 'firmado'])
  if (error) volver(ruta, error.message)
  revalidatePath(ruta)
  revalidatePath(RUTA)
  redirect(ruta)
}

export async function deleteContract(fd: FormData) {
  const { supabase } = await requireModule('contratos')
  const id = t(fd, 'id')
  const { data: c } = await supabase.from('work_contracts').select('status,signed_path').eq('id', id).single()
  if (!c || c.status !== 'borrador') volver(RUTA, 'Solo se puede eliminar un borrador. Un contrato firmado se anula.')
  const { error } = await supabase.from('work_contracts').delete().eq('id', id).eq('status', 'borrador')
  if (error) volver(RUTA, 'No se pudo eliminar: ' + error.message)
  if (c.signed_path) await supabase.storage.from(BUCKET).remove([c.signed_path])
  revalidatePath(RUTA)
  redirect(RUTA)
}