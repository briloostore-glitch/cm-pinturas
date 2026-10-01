'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { ROLES, type Role } from '@/lib/roles'

export async function updateUser(formData: FormData) {
  const { supabase, profile } = await getSession()
  if (profile?.role !== 'administrador') return

  const id = String(formData.get('id'))
  let role = String(formData.get('role')) as Role
  let active = formData.get('active') === 'on'
  if (!ROLES.includes(role)) return
  if (id === profile.id) { role = 'administrador'; active = true } // el administrador no puede quitarse el acceso

  await supabase.from('profiles').update({ role, active }).eq('id', id)
  revalidatePath('/usuarios')
}
