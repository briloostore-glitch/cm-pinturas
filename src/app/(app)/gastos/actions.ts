'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { guard } from '@/lib/guard'
import { msg, today } from '@/lib/money'

const t = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

export async function createExpense(fd: FormData) {
  const { supabase } = await guard('gastos')
  const amount = Number(fd.get('amount'))
  if (!(amount > 0)) redirect('/gastos?error=' + msg('Escribe un valor mayor que cero'))
  const { error } = await supabase.from('expenses').insert({
    category: t(fd, 'category'), description: t(fd, 'description') || null, amount,
    spent_at: t(fd, 'spent_at') || today(),
    work_order_id: t(fd, 'work_order_id') || null, supplier_id: t(fd, 'supplier_id') || null,
    receipt_path: t(fd, 'receipt_path') || null,
  })
  if (error) redirect('/gastos?error=' + msg('No se pudo guardar: ' + error.message))
  revalidatePath('/gastos')
}

export async function deleteExpense(fd: FormData) {
  const { supabase } = await guard('gastos')
  await supabase.from('expenses').delete().eq('id', t(fd, 'id'))
  revalidatePath('/gastos')
}
