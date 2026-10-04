import { requireModule } from '@/lib/auth'
import { ROLE_LABEL } from '@/lib/roles'
import { ACTIVAS } from '@/lib/avances'
import { createCrew, toggleCrew, addMember, removeMember, linkProfile, assignCrew } from './actions'

type Emp = { id: string; full_name: string; cargo: string | null; status: string | null }
type ObraC = { id: string; seq: number; status: string; cliente: string | null; direccion: string | null; crew_id: string | null }

export default async function Cuadrillas({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase, profile } = await requireModule('cuadrillas')
  const rol = String((profile as unknown as { role?: string }).role ?? '')
  const esAdmin = rol === 'administrador'

  const [{ data: emps }, { data: crews }, { data: miembros }, { data: obrasRaw }] = await Promise.all([
    supabase.rpc('empleados_cuadrilla'),
    supabase.from('crews').select('id,name,active').order('name'),
    supabase.from('crew_members').select('crew_id,employee_id'),
    supabase.rpc('obras_cuadrilla'),
  ])
  const empleados = (emps ?? []) as Emp[]
  const obras = ((obrasRaw ?? []) as ObraC[]).filter((o) => ACTIVAS.includes(o.status))
  const enCuadrilla = new Set((miembros ?? []).map((m) => m.employee_id as string))
  const sinCuadrilla = empleados.filter((e) => !enCuadrilla.has(e.id) && e.status !== 'inactivo')
  const porId = new Map(empleados.map((e) => [e.id, e]))

  // Solo administrador: usuarios del sistema y su vinculo con los empleados
  const { data: empFull } = esAdmin ? await supabase.from('employees').select('id,full_name,position,profile_id').order('full_name') : { data: null }
  const { data: perfiles } = esAdmin ? await supabase.from('profiles').select('id,full_name,email,role,active').order('full_name') : { data: null }
  const etiqueta = ROLE_LABEL as Record<string, string>
  const textoPerfil = (p: { full_name: string | null; email: string; role: string }) => (p.full_name ?? p.email) + ' - ' + (etiqueta[p.role] ?? p.role)

  return (
    <>
      <h1 className="text-2xl font-bold text-navy mb-1">{esAdmin ? 'Cuadrillas y accesos' : 'Cuadrillas'}</h1>
      <p className="text-sm text-slate-500 mb-4">
        {esAdmin
          ? 'Aqu\u00ed armas las cuadrillas, eliges qu\u00e9 cuadrilla trabaja en cada obra y vinculas a cada empleado con su usuario.'
          : 'Aqu\u00ed armas las cuadrillas y eliges qu\u00e9 cuadrilla trabaja en cada obra.'}{' '}
        Un trabajador solo ve las obras de su cuadrilla.
      </p>
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
                  <b>{c.name} <span className="text-sm font-normal text-slate-500">&middot; {c.active ? 'activa' : 'inactiva'}</span></b>
                  <button type="submit" className="btn btn-g">{c.active ? 'Desactivar' : 'Activar'}</button>
                </form>
                <ul className="space-y-1 mb-2">
                  {ids.map((eid) => (
                    <li key={eid}>
                      <form action={removeMember} className="flex items-center justify-between text-sm">
                        <input type="hidden" name="crew_id" value={c.id} />
                        <input type="hidden" name="employee_id" value={eid} />
                        <span>{porId.get(eid)?.full_name ?? 'Empleado'} <span className="text-slate-500">{porId.get(eid)?.cargo ?? ''}</span></span>
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
          {!(crews ?? []).length && <p className="text-sm text-slate-500">A&uacute;n no hay cuadrillas.</p>}
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-navy mb-2">Obras y cuadrilla</h2>
        <div className="space-y-2">
          {obras.map((o) => (
            <form key={o.id} action={assignCrew} className="border rounded-lg p-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="obra_id" value={o.id} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <b>Obra {String(o.seq).padStart(3, '0')}</b> &middot; {o.cliente ?? 'Sin cliente'}
                <div className="text-xs text-slate-500">{o.direccion ?? ''} &middot; {o.status.replace(/_/g, ' ')}</div>
              </div>
              <select name="crew_id" className="inp" style={{ maxWidth: 220 }} defaultValue={o.crew_id ?? ''}>
                <option value="">Sin cuadrilla</option>
                {(crews ?? []).filter((c) => c.active || c.id === o.crew_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="submit" className="btn btn-g">Guardar</button>
            </form>
          ))}
          {!obras.length && <p className="text-sm text-slate-500">No hay obras activas.</p>}
        </div>
      </div>

      {esAdmin && (
        <div className="card overflow-x-auto">
          <h2 className="font-bold text-navy mb-2">Usuario de cada empleado</h2>
          <table className="tbl">
            <thead><tr><th>Empleado</th><th>Cargo</th><th>Usuario del sistema</th></tr></thead>
            <tbody>
              {(empFull ?? []).map((e) => {
                const libres = (perfiles ?? []).filter((p) => p.active && (p.id === e.profile_id || !(empFull ?? []).some((x) => x.profile_id === p.id)))
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
              {!(empFull ?? []).length && <tr><td colSpan={3} className="text-slate-500">A&uacute;n no hay empleados.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}