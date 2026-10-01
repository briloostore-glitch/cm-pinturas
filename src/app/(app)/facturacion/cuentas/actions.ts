'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { guard } from '@/lib/guard'
import { getInvoiceDefaults } from '@/lib/docs'
import { msg, today } from '@/lib/money'

const t = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const num = (v: FormDataEntryValue | null) => Math.max(0, Number(v) || 0)
const STATUS = ['borrador', 'emitida', 'parcialmente_pagada', 'pagada', 'vencida', 'cancelada']
const fail = (m: string): never => redirect('/facturacion/cuentas/nueva?error=' + msg(m))

type Order = {
  id: string; client_id: string; sale_total: number
  clients: { first_name: string; last_name: string | null; document: string | null; phone: string | null; address: string | null } | null
  quotes: { seq: number; properties: { address: string | null } | null; quote_items: { description: string }[] } | null
}

export async function createInvoice(fd: FormData) {
  const { supabase } = await guard('facturacion')
  const wo = t(fd, 'work_order_id'), clientId = t(fd, 'client_id')
  if (!wo && !clientId) fail('Elige un trabajo o un cliente')
  const def = await getInvoiceDefaults(supabase)

  let row: Record<string, unknown> = {
    client_id: clientId, issued_at: today(), status: 'borrador', due_text: def.due_text, payment_means: def.payment_means,
    payee: def.payee, note: def.note, footer: def.footer, subtotal: 0, tax: 0, total: 0, advances: 0, tax_percent: 0,
  }
  let items = [{ description: '', unit: 'glb', qty: 1, unit_price: 0 }]

  if (wo) {
    const { data } = await supabase.from('work_orders')
      .select('id,client_id,sale_total,clients(first_name,last_name,document,phone,address),quotes(seq,properties(address),quote_items(description))')
      .eq('id', wo).single()
    const o = data as unknown as Order | null
    if (!o) fail('No se encontró el trabajo')
    const { data: pays } = await supabase.from('payments').select('amount').eq('work_order_id', wo)
    const names = [...new Set((o!.quotes?.quote_items ?? []).map((i) => i.description.replace(/,\s*(mano de obra y materiales|solo mano de obra)$/i, '')))]
    const concept = (names.join(', ') || 'Pintura y mantenimiento') + (o!.quotes ? ` (según cotización N.º ${String(o!.quotes.seq).padStart(3, '0')})` : '')
    const total = Math.round(Number(o!.sale_total))
    row = {
      ...row, client_id: o!.client_id, work_order_id: wo,
      client_name: `${o!.clients?.first_name ?? ''} ${o!.clients?.last_name ?? ''}`.trim(), client_doc: o!.clients?.document,
      client_phone: o!.clients?.phone, work_address: o!.quotes?.properties?.address || o!.clients?.address,
      subtotal: total, total, advances: (pays ?? []).reduce((s, p) => s + Number(p.amount), 0),
    }
    items = [{ description: concept, unit: 'glb', qty: 1, unit_price: total }]
  } else {
    const { data: c } = await supabase.from('clients').select('first_name,last_name,document,phone,address').eq('id', clientId).single()
    row = { ...row, client_name: `${c?.first_name ?? ''} ${c?.last_name ?? ''}`.trim(), client_doc: c?.document, client_phone: c?.phone, work_address: c?.address }
  }

  const { data: inv, error } = await supabase.from('invoices').insert(row).select('id').single()
  if (error || !inv) fail('No se pudo crear: ' + (error?.message ?? ''))
  await supabase.from('invoice_items').insert(items.map((i) => ({ ...i, invoice_id: inv!.id })))
  redirect(`/facturacion/cuentas/${inv!.id}`)
}

export async function saveInvoice(fd: FormData) {
  const { supabase } = await guard('facturacion')
  const id = t(fd, 'id')
  const items: { invoice_id: string; description: string; unit: string; qty: number; unit_price: number }[] = []
  for (let i = 0; i < 8; i++) {
    const d = t(fd, `d${i}`)
    if (d) items.push({ invoice_id: id, description: d, unit: t(fd, `u${i}`) || 'glb', qty: num(fd.get(`q${i}`)) || 1, unit_price: num(fd.get(`p${i}`)) })
  }
  const subtotal = items.reduce((s, i) => s + Math.round(i.qty * i.unit_price), 0)
  const taxPct = num(fd.get('tax_percent'))
  const tax = Math.round((subtotal * taxPct) / 100)

  let advances = num(fd.get('advances'))
  const { data: cur } = await supabase.from('invoices').select('work_order_id').eq('id', id).single()
  if (fd.get('recalc') === 'on' && cur?.work_order_id) {
    const { data: pays } = await supabase.from('payments').select('amount').eq('work_order_id', cur.work_order_id)
    advances = (pays ?? []).reduce((s, p) => s + Number(p.amount), 0)
  }
  const status = STATUS.includes(t(fd, 'status')) ? t(fd, 'status') : 'borrador'
  await supabase.from('invoices').update({
    client_name: t(fd, 'client_name'), client_doc: t(fd, 'client_doc'), client_phone: t(fd, 'client_phone'), work_address: t(fd, 'work_address'),
    issued_at: t(fd, 'issued_at') || today(), due_text: t(fd, 'due_text'), status, tax_percent: taxPct, subtotal, tax, total: subtotal + tax, advances,
    payment_means: t(fd, 'payment_means'), payee: t(fd, 'payee'), note: t(fd, 'note'), footer: t(fd, 'footer'),
  }).eq('id', id)
  await supabase.from('invoice_items').delete().eq('invoice_id', id)
  if (items.length) await supabase.from('invoice_items').insert(items)
  redirect(`/facturacion/cuentas/${id}?ok=1`)
}

export async function deleteInvoice(fd: FormData) {
  const { supabase, profile } = await guard('facturacion')
  if (profile.role !== 'administrador') redirect('/facturacion/cuentas?error=' + msg('Solo el administrador puede eliminar'))
  await supabase.from('invoices').delete().eq('id', t(fd, 'id'))
  redirect('/facturacion/cuentas')
}

export async function updateInvoiceDefaults(fd: FormData) {
  const { supabase } = await guard('facturacion')
  await supabase.from('settings').upsert({
    key: 'invoice_defaults', updated_at: new Date().toISOString(),
    value: { payment_means: t(fd, 'payment_means'), payee: t(fd, 'payee'), note: t(fd, 'note'), due_text: t(fd, 'due_text'), footer: t(fd, 'footer') },
  })
  revalidatePath('/facturacion/cuentas')
}
