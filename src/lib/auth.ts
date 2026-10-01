import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/roles'

export type Profile = { id: string; full_name: string | null; email: string | null; role: Role; active: boolean }

// Devuelve el cliente de Supabase y el perfil del usuario. Si no hay sesión, manda al login.
export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('profiles').select('id,full_name,email,role,active').eq('id', user.id).single()
  const profile = data && data.active ? (data as Profile) : null
  return { supabase, user, profile }
}
