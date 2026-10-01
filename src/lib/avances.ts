import type { SupabaseClient } from '@supabase/supabase-js'

export const BUCKET_AVANCES = 'avances'
export const ACTIVAS = ['pendiente', 'programado', 'en_ejecucion', 'pausado']

export type Obra = {
  id: string; seq: number; status: string; start_date: string | null; end_date: string | null
  cliente: string | null; direccion: string | null; ultimo_avance: number | null; ultima_fecha: string | null
}

export const hora = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' })

export function mensajeStorage(m: string) {
  if (/bucket not found/i.test(m)) return 'Falta crear el bucket "avances" en Supabase. Ejecuta el SQL de avances.'
  if (/row-level security|violates/i.test(m)) return 'Tu rol no tiene permiso para subir fotos de avances.'
  return 'No se pudo subir la foto: ' + m
}

// Obras visibles para quien consulta: todas las activas para administrador, supervisor y contabilidad;
// solo las de su cuadrilla para un trabajador (lo decide la funcion obras_avance en Supabase).
export async function listarObras(supabase: SupabaseClient): Promise<{ obras: Obra[]; error?: string }> {
  const { data, error } = await supabase.rpc('obras_avance')
  if (error) {
    return { obras: [], error: /obras_avance|could not find/i.test(error.message) ? 'Falta ejecutar el SQL de avances en Supabase.' : error.message }
  }
  return { obras: (data ?? []) as Obra[] }
}

export async function firmarFotos(supabase: SupabaseClient, paths: string[]) {
  const map = new Map<string, string>()
  if (!paths.length) return map
  const { data } = await supabase.storage.from(BUCKET_AVANCES).createSignedUrls(paths, 3600)
  for (const s of data ?? []) if (s.path && s.signedUrl) map.set(s.path, s.signedUrl)
  return map
}