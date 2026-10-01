'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { toMsg } from '@/lib/format'

export async function createClientRow(fd: FormData) {
  const { supabase } = await requireModule('clientes')
  const s = (k: string) => String(fd.get(k) ?? '').trim()
  if (!s('first_name')) redirect('/clientes?error=' + toMsg('Escribe el nombre del cliente'))
  const { error } = await supabase.from('clients').insert({
    first_name: s('first_name'), last_name: s('last_name') || null, document: s('document') || null,
    phone: s('phone') || null, whatsapp: s('whatsapp') || null, email: s('email') || null,
    address: s('address') || null, city: s('city') || null, client_type: s('client_type') || null,
  })
  if (error) redirect('/clientes?error=' + toMsg('No se pudo guardar: ' + error.message))
  revalidatePath('/clientes')
}

export async function deleteClientRow(fd: FormData) {
  const { supabase } = await requireModule('clientes')
  const { error } = await supabase.from('clients').delete().eq('id', String(fd.get('id')))
  if (error) redirect('/clientes?error=' + toMsg('No se puede eliminar: el cliente tiene cotizaciones o visitas'))
  revalidatePath('/clientes')
}