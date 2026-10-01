'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { guard } from '@/lib/guard'
import { msg, today } from '@/lib/money'

const t = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const fail = (m: string): never => redirect('/facturacion?error=' + msg(m))

export async function createPayment(fd: FormData) {
  const { supabase, profile } = await guard('facturacion')
  const [kindOfTarget, targetId] = t(fd, 'target').split(':')
  const method = t(fd, 'method')
  const paidAt = t(fd, 'paid_at') || today()
  const notes = t(fd, 'notes') || null
  if (!targetId) fail('Elige el trabajo o la visita que se está pagando')

  if (kindOfTarget === 'wo') {
    const amount = Number(fd.get('amount'))
    if (!(amount > 0)) fail('Escribe un valor mayor que cero')
    const [{ data: order }, { data: prev }] = await Promise.all([
      supabase.from('work_orders').select('id,client_id,sale_total').eq('id', targetId).single(),
      supabase.from('payments').select('amount').eq('work_order_id', targetId),
    ])
    if (!order) fail('No se encontró el trabajo')
    const saldo = Number(order!.sale_total) - (prev ?? []).reduce((s, p) => s + Number(p.amount), 0)
    if (amount > saldo) fail(`El pago supera el saldo pendiente (${new Intl.NumberFormat('es-CO').format(saldo)})`)
    const { error } = await supabase.from('payments').insert({
      client_id: order!.client_id, work_order_id: targetId, kind: t(fd, 'kind') || 'abono', method, amount, paid_at: paidAt, notes, recorded_by: profile.id,
    })
    if (error) fail('No se pudo registrar el pago: ' + error.message)
  } else {
    // Visita técnica: el valor es el que tenía al crearse y solo lo registra el administrador
    if (profile.role !== 'administrador') fail('Solo el administrador verifica el pago de una visita')
    const { data: v } = await supabase.from('visits').select('id,client_id,price,status,paid_at').eq('id', targetId).single()
    if (!v) fail('No se encontró la visita')
    if (v!.paid_at) fail('Esa visita ya tiene el pago registrado')
    const { error } = await supabase.from('payments').insert({
      client_id: v!.client_id, visit_id: targetId, kind: 'visita', method, amount: v!.price, paid_at: paidAt, notes, recorded_by: profile.id,
    })
    if (error) fail('No se pudo registrar el pago: ' + error.message)
    const upd: Record<string, unknown> = { paid_amount: v!.price, paid_at: paidAt, payment_method: method, payment_verified_by: profile.id }
    if (['solicitud_recibida', 'pago_pendiente'].includes(v!.status)) upd.status = 'pago_recibido'
    const { error: e2 } = await supabase.from('visits').update(upd).eq('id', targetId)
    if (e2) fail('El pago se guardó, pero no se pudo actualizar la visita: ' + e2.message)
  }
  revalidatePath('/facturacion')
}

export async function deletePayment(fd: FormData) {
  const { supabase, profile } = await guard('facturacion')
  if (profile.role !== 'administrador') fail('Solo el administrador puede eliminar pagos')
  const { data: p } = await supabase.from('payments').select('visit_id').eq('id', t(fd, 'id')).single()
  if (p?.visit_id) fail('El pago de una visita no se elimina desde aquí')
  await supabase.from('payments').delete().eq('id', t(fd, 'id'))
  revalidatePath('/facturacion')
}
