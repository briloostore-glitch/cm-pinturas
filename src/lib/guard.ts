import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { NAV, homeFor } from '@/lib/roles'

// Exige sesión y que el rol del usuario pueda entrar a ese módulo
export async function guard(slug: string) {
  const s = await getSession()
  if (!s.profile) notFound()
  const item = NAV.find((n) => n.slug === slug)
  if (item && !item.roles.includes(s.profile.role)) redirect(homeFor(s.profile.role))
  return { supabase: s.supabase, profile: s.profile }
}
