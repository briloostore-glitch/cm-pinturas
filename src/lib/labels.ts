import type { SupabaseClient } from '@supabase/supabase-js'

export type Cli = { id: string; first_name: string; last_name: string | null }

export const nombre = (c?: Pick<Cli, 'first_name' | 'last_name'> | null) =>
  c ? `${c.first_name} ${c.last_name ?? ''}`.trim() : '-'

export const estado = (s: string) => s.replace(/_/g, ' ')

export async function clientesPorId(supabase: SupabaseClient, ids: string[]) {
  const map = new Map<string, Cli>()
  const uniq = Array.from(new Set(ids.filter(Boolean)))
  if (!uniq.length) return map
  const { data } = await supabase.from('clients').select('id,first_name,last_name').in('id', uniq)
  for (const c of (data ?? []) as Cli[]) map.set(c.id, c)
  return map
}