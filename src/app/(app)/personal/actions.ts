'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { guard } from '@/lib/guard'
import { msg } from '@/lib/money'

const t = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const n = (fd: FormData, k: string) => Math.max(0, Number(fd.get(k)) || 0)

export async function createEmployee(fd: FormData) {
  const { supabase } = await guard('personal')
  if (!t(fd, 'full_name')) redirect('/personal?error=' + msg('Escribe el nombre del trabajador'))
  const { error } = await supabase.from('employees').insert({
    full_name: t(fd, 'full_name'), document: t(fd, 'document') || null, phone: t(fd, 'phone') || null,
    position: t(fd, 'position'), pay_type: t(fd, 'pay_type'), daily_rate: n(fd, 'daily_rate'), job_rate: n(fd, 'job_rate'),
    hired_at: t(fd, 'hired_at') || null,
  })
  if (error) redirect('/personal?error=' + msg('No se pudo guardar: ' + error.message))
  revalidatePath('/personal')
}

export async function updateEmployee(fd: FormData) {
  const { supabase } = await guard('personal')
  await supabase.from('employees').update({
    position: t(fd, 'position'), pay_type: t(fd, 'pay_type'), daily_rate: n(fd, 'daily_rate'), job_rate: n(fd, 'job_rate'),
    status: t(fd, 'status') === 'inactivo' ? 'inactivo' : 'activo',
  }).eq('id', t(fd, 'id'))
  revalidatePath('/personal')
}

export async function deleteEmployee(fd: FormData) {
  const { supabase } = await guard('personal')
  const { error } = await supabase.from('employees').delete().eq('id', t(fd, 'id'))
  if (error) redirect('/personal?error=' + msg('No se puede eliminar: tiene nómina registrada. Márcalo como inactivo.'))
  revalidatePath('/personal')
}
