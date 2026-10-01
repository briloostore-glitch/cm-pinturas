import { requireModule } from '@/lib/auth'
import { ROLE_LABEL } from '@/lib/roles'
import { createCrew, toggleCrew, addMember, removeMember, linkProfile } from './actions'

export default async function Cuadrillas({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase } = await requireModule('cuadrillas')
  const [{ data: emps }, { data: crews }, { data: miembros }, { data: perfiles }] = await Promise.all([
    supabase.from('employees').select('id,full_name,position,status,profile_id').order('full_name'),
    supabase.from('crews').select('id,name,active').order('name'),
    supabase.from('crew_members').select('crew_id,employee_id'),
    supabase.from('profiles').select('id,full_name,email,role,active').order('full_name'),
  ])
  const empleados = emps ?? []
  const etiqueta = ROLE_LABEL as Record<string, string>
  const enCuadrilla = new Set((miembros ?? []).map((m) => m.employee_id as string))
  const sinCuadrilla = empleados.filter((e) => !enCuadrilla.has(e.id))
  const porId = new Map(empleados.map((e) => [e.id as string, e]))
  const textoPerfil = (p: { full_name: string | null; email: string; role: string }) => `${p.full_name ?? p.email} - ${etiqueta[p.role] ?? p.role}`

  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-1">Cuadrillas y accesos</h1>
      <p className="text-sm text-slate-500 mb-4">AquÃ­ armas las cuadrillas y vinculas a cada empleado con su usuario. Un trabajador solo ve las obras de su cuadrilla.</p>
      {error && <div className="err">{error}</div>}

      <div className="card">
        <h2 className="font-bold text-navy mb-2">Cuadrillas</h2>
        <form action={createCrew} className="flex gap-2 mb-3">
          <input name="name" className="inp" placeholder="Nombre de la nueva cuadrilla" />
          <button type="submit" className="btn">Crear</button>
        </form>
        <div className="space-y-3">
          {(crews ?? []).map((c) => {
            const ids = (miembros ?? []).filter((m) => m.crew_id === c.id).map((m) => m.employee_id as string)
            return (
              <div key={c.id} className="border rounded-lg p-3">
                <form action={toggleCrew} className="flex items-center justify-between mb-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="active" value={c.active ? 'false' : 'true'} />
                  <b>{c.name} <span className="text-sm font-normal text-slate-500">Â· {c.active ? 'activa' : 'inactiva'}</span></b>
                  <button type="submit" className="btn btn-g">{c.active ? 'Desactivar' : 'Activar'}</button>
                </form>
                <ul className="space-y-1 mb-2">
                  {ids.map((eid) => (
                    <li key={eid}>
                      <form action={removeMember} className="flex items-center justify-between text-sm">
                        <input type="hidden" name="crew_id" value={c.id} />
                        <input type="hidden" name="employee_id" value={eid} />
                        <span>{porId.get(eid)?.full_name ?? 'Empleado'} <span className="text-slate-500">{porId.get(eid)?.position ?? ''}</span></span>
                        <button type="submit" className="btn btn-g">Quitar</button>
                      </form>
                    </li>
                  ))}
                  {!ids.length && <li className="text-sm text-slate-500">Sin integrantes.</li>}
                </ul>
                <form action={addMember} className="flex gap-2">
                  <input type="hidden" name="crew_id" value={c.id} />
                  <select name="employee_id" className="inp" defaultValue="">
                    <option value="" disabled>Agregar empleado sin cuadrilla</option>
                    {sinCuadrilla.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                  <button type="submit" className="btn">Agregar</button>
                </form>
              </div>
            )
          })}
          {!(crews ?? []).length && <p className="text-sm text-slate-500">AÃºn no hay cuadrillas.</p>}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-bold text-navy mb-2">Usuario de cada empleado</h2>
        <table className="tbl">
          <thead><tr><th>Empleado</th><th>Cargo</th><th>Usuario del sistema</th></tr></thead>
          <tbody>
            {empleados.map((e) => {
              const libres = (perfiles ?? []).filter((p) => p.active && (p.id === e.profile_id || !empleados.some((x) => x.profile_id === p.id)))
              return (
                <tr key={e.id}>
                  <td>{e.full_name}</td><td>{e.position ?? '-'}</td>
                  <td>
                    <form action={linkProfile} className="flex gap-2">
                      <input type="hidden" name="employee_id" value={e.id} />
                      <select name="profile_id" className="inp" defaultValue={e.profile_id ?? ''}>
                        <option value="">Sin usuario</option>
                        {libres.map((p) => <option key={p.id} value={p.id}>{textoPerfil(p)}</option>)}
                      </select>
                      <button type="submit" className="btn btn-g">Guardar</button>
                    </form>
                  </td>
                </tr>
              )
            })}
            {!empleados.length && <tr><td colSpan={3} className="text-slate-500">Primero registra empleados en Personal.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}