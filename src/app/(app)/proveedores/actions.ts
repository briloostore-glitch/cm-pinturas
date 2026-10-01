'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { toMsg } from '@/lib/format'

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

function volver(ruta: string, m: string): never {
  return redirect(ruta + '?error=' + toMsg(m))
}

function datos(fd: FormData) {
  return {
    company: txt(fd, 'company'), contact: txt(fd, 'contact') || null, phone: txt(fd, 'phone') || null,
    whatsapp: txt(fd, 'whatsapp') || null, email: txt(fd, 'email') || null, address: txt(fd, 'address') || null,
    products: txt(fd, 'products') || null,
  }
}

export async function createSupplier(fd: FormData) {
  const { supabase } = await requireModule('proveedores')
  const d = datos(fd)
  if (!d.company) volver('/proveedores/nuevo', 'Escribe el nombre de la empresa')
  const { error } = await supabase.from('suppliers').insert(d)
  if (error) volver('/proveedores/nuevo', 'No se pudo crear: ' + error.message)
  redirect('/proveedores')
}

export async function updateSupplier(fd: FormData) {
  const { supabase } = await requireModule('proveedores')
  const id = txt(fd, 'id')
  const d = datos(fd)
  if (!d.company) volver(`/proveedores/${id}`, 'El nombre de la empresa no puede quedar vacío')
  const { error } = await supabase.from('suppliers').update(d).eq('id', id)
  if (error) volver(`/proveedores/${id}`, 'No se pudo guardar: ' + error.message)
  revalidatePath('/proveedores')
  redirect('/proveedores')
}

export async function deleteSupplier(fd: FormData) {
  const { supabase } = await requireModule('proveedores')
  const id = txt(fd, 'id')
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) {
    volver(`/proveedores/${id}`, error.code === '23503'
      ? 'No se puede eliminar: este proveedor está usado en materiales o gastos'
      : 'No se pudo eliminar: ' + error.message)
  }
  revalidatePath('/proveedores')
  redirect('/proveedores')
}