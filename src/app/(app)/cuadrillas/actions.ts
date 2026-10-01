'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { toMsg } from '@/lib/format'

const RUTA = '/cuadrillas'
const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

function volver(m: string): never {
  return redirect(RUTA + '?error=' + toMsg(m))
}

function listo(): never {
  revalidatePath(RUTA)
  return redirect(RUTA)
}

export async function createCrew(fd: FormData) {
  const { supabase } = await requireModule('cuadrillas')
  const name = txt(fd, 'name')
  if (!name) volver('Escribe el nombre de la cuadrilla')
  const { error } = await supabase.from('crews').insert({ name, active: true })
  if (error) volver('No se pudo crear la cuadrilla: ' + error.message)
  listo()
}

export async function toggleCrew(fd: FormData) {
  const { supabase } = await requireModule('cuadrillas')
  const { error } = await supabase.from('crews').update({ active: txt(fd, 'active') === 'true' }).eq('id', txt(fd, 'id'))
  if (error) volver('No se pudo cambiar la cuadrilla: ' + error.message)
  listo()
}

// Un empleado pertenece a una sola cuadrilla: al agregarlo se saca de la anterior.
export async function addMember(fd: FormData) {
  const { supabase } = await requireModule('cuadrillas')
  const crewId = txt(fd, 'crew_id')
  const empId = txt(fd, 'employee_id')
  if (!crewId || !empId) volver('Elige un empleado para agregar')
  const { error: e1 } = await supabase.from('crew_members').delete().eq('employee_id', empId)
  if (e1) volver('No se pudo mover al empleado: ' + e1.message)
  const { error: e2 } = await supabase.from('crew_members').insert({ crew_id: crewId, employee_id: empId })
  if (e2) volver('No se pudo agregar al empleado: ' + e2.message)
  listo()
}

export async function removeMember(fd: FormData) {
  const { supabase } = await requireModule('cuadrillas')
  const { error } = await supabase.from('crew_members').delete().eq('crew_id', txt(fd, 'crew_id')).eq('employee_id', txt(fd, 'employee_id'))
  if (error) volver('No se pudo quitar al empleado: ' + error.message)
  listo()
}

export async function linkProfile(fd: FormData) {
  const { supabase } = await requireModule('cuadrillas')
  const empId = txt(fd, 'employee_id')
  const profileId = txt(fd, 'profile_id')
  if (profileId) {
    const { data } = await supabase.from('employees').select('id').eq('profile_id', profileId).neq('id', empId).limit(1)
    if (data?.length) volver('Ese usuario ya estÃ¡ vinculado a otro empleado')
  }
  const { error } = await supabase.from('employees').update({ profile_id: profileId || null }).eq('id', empId)
  if (error) volver('No se pudo vincular el usuario: ' + error.message)
  listo()
}