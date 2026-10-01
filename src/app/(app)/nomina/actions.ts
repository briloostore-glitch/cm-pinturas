'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { guard } from '@/lib/guard'
import { msg, today } from '@/lib/money'

const t = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const n = (fd: FormData, k: string) => Math.max(0, Number(fd.get(k)) || 0)

async function isOpen(supabase: SupabaseClient, periodId: string) {
  const { data } = await supabase.from('payroll_periods').select('status').eq('id', periodId).single()
  return data?.status === 'abierta'
}

// Agrega al período a los trabajadores activos que todavía no están
async function addMissing(supabase: SupabaseClient, periodId: string) {
  const [{ data: staff }, { data: have }] = await Promise.all([
    supabase.from('employees').select('id').eq('status', 'activo'),
    supabase.from('payroll_items').select('employee_id').eq('period_id', periodId),
  ])
  const done = new Set((have ?? []).map((h) => h.employee_id))
  const rows = (staff ?? []).filter((s) => !done.has(s.id)).map((s) => ({ period_id: periodId, employee_id: s.id }))
  if (rows.length) await supabase.from('payroll_items').insert(rows)
}

export async function createPeriod(fd: FormData) {
  const { supabase } = await guard('nomina')
  if (!t(fd, 'name')) redirect('/nomina?error=' + msg('Escribe el nombre del período'))
  const { data, error } = await supabase.from('payroll_periods')
    .insert({ name: t(fd, 'name'), start_date: t(fd, 'start_date') || null, end_date: t(fd, 'end_date') || null })
    .select('id').single()
  if (error || !data) redirect('/nomina?error=' + msg('No se pudo crear el período'))
  await addMissing(supabase, data!.id)
  redirect(`/nomina/${data!.id}`)
}

export async function addMissingEmployees(fd: FormData) {
  const { supabase } = await guard('nomina')
  const id = t(fd, 'period_id')
  if (await isOpen(supabase, id)) await addMissing(supabase, id)
  revalidatePath(`/nomina/${id}`)
}

export async function saveItem(fd: FormData) {
  const { supabase } = await guard('nomina')
  const periodId = t(fd, 'period_id')
  if (!(await isOpen(supabase, periodId))) redirect(`/nomina/${periodId}?error=` + msg('El período está cerrado'))
  const { data } = await supabase.from('payroll_items').select('employees(pay_type,daily_rate)').eq('id', t(fd, 'id')).single()
  const emp = (data as unknown as { employees: { pay_type: string; daily_rate: number } | null } | null)?.employees
  const days = n(fd, 'days')
  const base = emp?.pay_type === 'diario' ? Math.round(days * Number(emp.daily_rate)) : n(fd, 'base')
  await supabase.from('payroll_items')
    .update({ days, base, bonus: n(fd, 'bonus'), advances: n(fd, 'advances'), deductions: n(fd, 'deductions') })
    .eq('id', t(fd, 'id'))
  revalidatePath(`/nomina/${periodId}`)
}

export async function setPaid(fd: FormData) {
  const { supabase } = await guard('nomina')
  const paid = t(fd, 'paid') === '1'
  await supabase.from('payroll_items').update({ paid, paid_at: paid ? today() : null }).eq('id', t(fd, 'id'))
  revalidatePath(`/nomina/${t(fd, 'period_id')}`)
}

export async function setPeriodStatus(fd: FormData) {
  const { supabase } = await guard('nomina')
  await supabase.from('payroll_periods').update({ status: t(fd, 'status') === 'cerrada' ? 'cerrada' : 'abierta' }).eq('id', t(fd, 'period_id'))
  revalidatePath(`/nomina/${t(fd, 'period_id')}`)
  revalidatePath('/nomina')
}
