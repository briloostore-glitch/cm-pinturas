import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ROLES, ROLE_LABEL, homeFor } from '@/lib/roles'
import { updateUser } from './actions'

export default async function Usuarios() {
  const { supabase, profile } = await getSession()
  if (!profile) return null
  if (profile.role !== 'administrador') redirect(homeFor(profile.role))

  const { data: users } = await supabase.from('profiles').select('id,full_name,email,role,active').order('created_at')

  return (
    <>
      <h1 className="text-2xl font-bold text-navy">Usuarios y roles</h1>
      <p className="text-slate-500 mb-5">
        Para crear un usuario nuevo, agrégalo en Supabase (Authentication → Users). Aparecerá aquí como Trabajador y desde aquí le asignas su rol.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="p-3">Usuario</th><th className="p-3">Rol</th><th className="p-3">Activo</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="p-3">
                  <div className="font-medium">{u.full_name || u.email}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td colSpan={3} className="p-0">
                  <form action={updateUser} className="flex items-center gap-4 p-3">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue={u.role} className="rounded-lg border border-slate-300 px-2 py-1.5">
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="active" defaultChecked={u.active} /> Activo
                    </label>
                    <button className="rounded-lg bg-navy text-white px-3 py-1.5">Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
