import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { homeFor } from '@/lib/roles'

export default async function Home() {
  const { profile } = await getSession()
  redirect(profile ? homeFor(profile.role) : '/panel')
}
