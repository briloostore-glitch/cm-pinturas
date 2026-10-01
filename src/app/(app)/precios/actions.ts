'use server'

import { revalidatePath } from 'next/cache'
import { requireModule } from '@/lib/auth'

const num = (fd: FormData, k: string) => Math.max(0, Number(fd.get(k)) || 0)
const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

export async function updateService(fd: FormData) {
  const { supabase } = await requireModule('precios')
  await supabase.from('services').update({ labor_per_m2: num(fd, 'labor'), material_per_m2: num(fd, 'material') }).eq('id', txt(fd, 'id'))
  revalidatePath('/precios')
}

export async function updateZone(fd: FormData) {
  const { supabase } = await requireModule('precios')
  await supabase.from('zones').update({ labor_percent: num(fd, 'labor_percent'), transport: num(fd, 'transport') }).eq('name', txt(fd, 'name'))
  revalidatePath('/precios')
}

async function setKey(key: string, value: unknown) {
  const { supabase } = await requireModule('precios')
  await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
}

export async function updateSettings(fd: FormData) {
  for (const k of ['visit_price', 'margin_percent', 'other_costs', 'tax_percent', 'deposit_percent', 'quote_validity_days']) {
    await setKey(k, num(fd, k))
  }
  revalidatePath('/precios')
}

export async function updateCompany(fd: FormData) {
  await setKey('company', { name: txt(fd, 'name'), owner: txt(fd, 'owner'), nit: txt(fd, 'nit'), contact: txt(fd, 'contact'), location: txt(fd, 'location') })
  await setKey('quote_terms', {
    includes: txt(fd, 'includes'), excludes: txt(fd, 'excludes'), payment: txt(fd, 'payment'),
    time: txt(fd, 'time'), warranty: txt(fd, 'warranty'), footer: txt(fd, 'footer'),
  })
  revalidatePath('/precios')
}