import type { SupabaseClient } from '@supabase/supabase-js'

export type Settings = {
  visit_price: number; quote_validity_days: number; deposit_percent: number
  tax_percent: number; margin_percent: number; other_costs: number
  company: { name: string; owner: string; nit: string; contact: string; location: string }
  quote_terms: { includes: string; excludes: string; payment: string; time: string; warranty: string; footer: string }
}

const DEFAULTS: Settings = {
  visit_price: 49900, quote_validity_days: 15, deposit_percent: 50, tax_percent: 0, margin_percent: 20, other_costs: 0,
  company: { name: 'CM Pinturas y Mantenimiento', owner: '', nit: '', contact: '', location: '' },
  quote_terms: { includes: '', excludes: '', payment: '', time: '', warranty: '', footer: '' },
}

export async function getSettings(supabase: SupabaseClient): Promise<Settings> {
  const { data } = await supabase.from('settings').select('key,value')
  const out: Record<string, unknown> = { ...DEFAULTS }
  for (const r of data ?? []) out[r.key] = r.value
  return out as Settings
}