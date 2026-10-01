import Sidebar from '@/components/Sidebar'
import { getSession } from '@/lib/auth'
import { logout } from '@/app/login/actions'
import { NAV, ROLE_LABEL } from '@/lib/roles'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await getSession()

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-xl border border-slate-200 p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-navy">Usuario sin acceso</h1>
          <p className="text-sm text-slate-600">
            Tu usuario ({user.email}) no tiene un perfil activo. Pídele al administrador que lo active.
          </p>
          <form action={logout}>
            <button className="rounded-lg bg-navy text-white px-4 py-2">Cerrar sesión</button>
          </form>
        </div>
      </main>
    )
  }

  const items = NAV.filter((n) => n.roles.includes(profile.role))
  return (
    <div className="min-h-screen md:flex">
      <Sidebar items={items} name={profile.full_name || profile.email || 'Usuario'} role={ROLE_LABEL[profile.role]} />
      <main className="flex-1 min-w-0 p-4 md:p-8 print:p-0">{children}</main>
    </div>
  )
}
