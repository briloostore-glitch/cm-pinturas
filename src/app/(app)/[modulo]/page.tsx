import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { NAV, homeFor } from '@/lib/roles'

// Módulos que se construyen en las fases siguientes
export default async function Modulo({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo } = await params
  const item = NAV.find((n) => n.slug === modulo)
  if (!item) notFound()
  const { profile } = await getSession()
  if (!profile) return null
  if (!item.roles.includes(profile.role)) redirect(homeFor(profile.role))

  return (
    <>
      <h1 className="text-2xl font-bold text-navy">{item.icon} {item.label}</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-8 mt-5 text-center text-slate-500">
        Este módulo se construye en la <b>Fase {item.phase}</b>.
      </div>
    </>
  )
}
