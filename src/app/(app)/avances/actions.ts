'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { toMsg } from '@/lib/format'
import { BUCKET_AVANCES, mensajeStorage } from '@/lib/avances'

const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_BYTES = 2 * 1024 * 1024
const MAX_FOTOS = 4

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

function volver(ruta: string, m: string): never {
  return redirect(ruta + '?error=' + toMsg(m))
}

async function limpiar(supabase: SupabaseClient, paths: string[]) {
  if (paths.length) await supabase.storage.from(BUCKET_AVANCES).remove(paths)
}

export async function addProgress(fd: FormData) {
  const { supabase, profile } = await requireModule('avances')
  const id = txt(fd, 'work_order_id')
  const ruta = `/avances/${id}`
  const pct = Number(fd.get('progress_percent'))
  if (!Number.isInteger(pct) || pct < 0 || pct > 100) volver(ruta, 'El avance debe ser un nÃºmero entero entre 0 y 100')
  const note = txt(fd, 'note')
  const fotos = fd.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
  if (!note && !fotos.length) volver(ruta, 'Escribe una nota o agrega al menos una foto')
  if (fotos.length > MAX_FOTOS) volver(ruta, `MÃ¡ximo ${MAX_FOTOS} fotos por avance`)

  const subidas: string[] = []
  for (const f of fotos) {
    const ext = TIPOS[f.type]
    if (!ext) { await limpiar(supabase, subidas); volver(ruta, 'Las fotos deben ser JPG, PNG o WEBP') }
    if (f.size > MAX_BYTES) { await limpiar(supabase, subidas); volver(ruta, 'Una foto supera 2 MB') }
    const path = `${id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET_AVANCES).upload(path, f, { contentType: f.type, upsert: false })
    if (error) { await limpiar(supabase, subidas); volver(ruta, mensajeStorage(error.message)) }
    subidas.push(path)
  }

  const { error } = await supabase.from('work_progress').insert({
    work_order_id: id, author_id: profile.id, progress_percent: pct, note: note || null, photo_paths: subidas,
  })
  if (error) {
    await limpiar(supabase, subidas)
    volver(ruta, 'No se pudo registrar el avance: ' + error.message)
  }
  revalidatePath(ruta)
  revalidatePath('/avances')
  redirect(ruta)
}

export async function deleteProgress(fd: FormData) {
  const { supabase } = await requireModule('avances')
  const id = txt(fd, 'id')
  const ruta = `/avances/${txt(fd, 'work_order_id')}`
  const { data: a } = await supabase.from('work_progress').select('photo_paths').eq('id', id).single()
  const { error } = await supabase.from('work_progress').delete().eq('id', id)
  if (error) volver(ruta, 'No se pudo eliminar el avance: ' + error.message)
  await limpiar(supabase, (a?.photo_paths ?? []) as string[])
  revalidatePath(ruta)
  revalidatePath('/avances')
  redirect(ruta)
}