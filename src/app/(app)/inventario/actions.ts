'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { toMsg } from '@/lib/format'

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const num = (fd: FormData, k: string) => { const n = Number(fd.get(k)); return Number.isFinite(n) && n >= 0 ? n : 0 }

function volver(ruta: string, m: string): never {
  return redirect(ruta + '?error=' + toMsg(m))
}

function datosMaterial(fd: FormData) {
  return {
    name: txt(fd, 'name'), category: txt(fd, 'category') || null, brand: txt(fd, 'brand') || null,
    unit: txt(fd, 'unit') || 'und', cost_price: num(fd, 'cost_price'), suggested_price: num(fd, 'suggested_price'),
    min_stock: num(fd, 'min_stock'), supplier_id: txt(fd, 'supplier_id') || null,
  }
}

export async function createMaterial(fd: FormData) {
  const { supabase, profile } = await requireModule('inventario')
  const d = datosMaterial(fd)
  if (!d.name) volver('/inventario/nuevo', 'Escribe el nombre del material')
  // El stock empieza en 0; el stock inicial entra como movimiento para que lo sume el trigger.
  const { data, error } = await supabase.from('materials').insert({ ...d, stock: 0, active: true }).select('id').single()
  if (error || !data) volver('/inventario/nuevo', 'No se pudo crear el material: ' + (error?.message ?? ''))
  const inicial = num(fd, 'initial_stock')
  if (inicial > 0) {
    const { error: e2 } = await supabase.from('inventory_movements').insert({
      material_id: data.id, kind: 'entrada', qty: inicial, user_id: profile.id, note: 'Stock inicial',
    })
    if (e2) volver(`/inventario/${data.id}`, 'El material se creó, pero no se pudo registrar el stock inicial: ' + e2.message)
  }
  redirect(`/inventario/${data.id}`)
}

export async function updateMaterial(fd: FormData) {
  const { supabase } = await requireModule('inventario')
  const id = txt(fd, 'id')
  const d = datosMaterial(fd)
  if (!d.name) volver(`/inventario/${id}`, 'El nombre no puede quedar vacío')
  const { error } = await supabase.from('materials').update({ ...d, active: fd.get('active') === 'on' }).eq('id', id)
  if (error) volver(`/inventario/${id}`, 'No se pudo guardar: ' + error.message)
  revalidatePath(`/inventario/${id}`)
  redirect(`/inventario/${id}`)
}

export async function addMovement(fd: FormData) {
  const { supabase, profile } = await requireModule('inventario')
  const id = txt(fd, 'material_id')
  const ruta = `/inventario/${id}`
  const kind = txt(fd, 'kind')
  const cantidad = Number(fd.get('qty'))
  if (!['entrada', 'salida', 'ajuste'].includes(kind)) volver(ruta, 'Elige el tipo de movimiento')
  if (!Number.isFinite(cantidad) || cantidad === 0) volver(ruta, 'Indica una cantidad distinta de cero')
  if (kind !== 'ajuste' && cantidad < 0) volver(ruta, 'En entradas y salidas escribe la cantidad en positivo')
  const { data: m } = await supabase.from('materials').select('stock').eq('id', id).single()
  if (!m) volver(ruta, 'No se encontró el material')
  // Entrada suma, salida resta, ajuste respeta el signo que escribas.
  const qty = kind === 'salida' ? -cantidad : cantidad
  if (Number(m.stock) + qty < 0) volver(ruta, `No hay stock suficiente. Disponible: ${Number(m.stock)}`)
  const { error } = await supabase.from('inventory_movements').insert({
    material_id: id, kind, qty, work_order_id: txt(fd, 'work_order_id') || null, user_id: profile.id, note: txt(fd, 'note') || null,
  })
  if (error) volver(ruta, 'No se pudo registrar el movimiento: ' + error.message)
  revalidatePath(ruta)
  redirect(ruta)
}