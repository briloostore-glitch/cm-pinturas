import type { SupabaseClient } from '@supabase/supabase-js'

export const BUCKET = 'materiales'
const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_BYTES = 2 * 1024 * 1024

export type Img = { error?: string; subido?: string; quitar?: boolean }

function mensaje(m: string) {
  if (/bucket not found/i.test(m)) return 'Falta crear el bucket "materiales" en Supabase. Ejecuta el SQL de imágenes.'
  if (/row-level security|violates/i.test(m)) return 'Tu rol no tiene permiso para subir imágenes (revisa las políticas del bucket).'
  return 'No se pudo subir la imagen: ' + m
}

// Sube la foto del formulario (campo "image"). Devuelve la ruta subida, o quitar=true si marcaron "quitar foto".
export async function subirImagen(supabase: SupabaseClient, fd: FormData): Promise<Img> {
  const f = fd.get('image')
  if (f instanceof File && f.size > 0) {
    const ext = TIPOS[f.type]
    if (!ext) return { error: 'La imagen debe ser JPG, PNG o WEBP' }
    if (f.size > MAX_BYTES) return { error: 'La imagen supera 2 MB' }
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type, upsert: false })
    if (error) return { error: mensaje(error.message) }
    return { subido: path }
  }
  return fd.get('remove_image') === 'on' ? { quitar: true } : {}
}

export async function quitarArchivo(supabase: SupabaseClient, path?: string | null) {
  if (path) await supabase.storage.from(BUCKET).remove([path])
}