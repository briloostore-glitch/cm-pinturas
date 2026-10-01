import Link from 'next/link'
import { notFound } from 'next/navigation'
import { guard } from '@/lib/guard'
import { ui } from '@/lib/ui'
import { cop } from '@/lib/money'
import ConfirmAction from '@/components/ConfirmAction'
import FacturacionTabs from '@/components/FacturacionTabs'
import { deleteInvoice, saveInvoice } from '../actions'

const STATUS: [string, string][] = [['borrador', 'Borrador'], ['emitida', 'Emitida'], ['parcialmente_pagada', 'Parcialmente pagada'], ['pagada', 'Pagada'], ['vencida', 'Vencida'], ['cancelada', 'Cancelada']]

export default async function EditarCuenta({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { id } = await params
  const { ok } = await searchParams
  const { supabase, profile } = await guard('facturacion')
  const { data: inv } = await supabase.from('invoices').select('*').eq('id', id).single()
  if (!inv) notFound()
  const { data: it } = await supabase.from('invoice_items').select('description,unit,qty,unit_price').eq('invoice_id', id).order('id')
  const items = it ?? []
  const text = (name: string, label: string, v: string | null, full = false) => (
    <div className={full ? 'col-span-full' : ''}><label className={ui.lbl}>{label}</label><input name={name} defaultValue={v ?? ''} className={ui.inp} /></div>
  )

  return (
    <>
      <FacturacionTabs active="cuentas" />
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className={ui.h1}>Cuenta de cobro {String(inv.seq).padStart(3, '0')}</h1>
        <Link href={`/facturacion/cuentas/${id}/imprimir`} className={ui.btnO}>Ver hoja para imprimir</Link>
      </div>
      {ok && <div className="bg-green-50 text-green-800 rounded-lg px-3 py-2 mb-4 text-sm">Cambios guardados.</div>}
      <form action={saveInvoice} className={ui.card}>
        <input type="hidden" name="id" value={id} />
        <h2 className="font-semibold mb-3">Cobrar a</h2>
        <div className={ui.grid}>
          {text('client_name', 'Cliente', inv.client_name)}{text('client_doc', 'NIT / C.C.', inv.client_doc)}
          {text('client_phone', 'Teléfono', inv.client_phone)}{text('work_address', 'Obra (dirección y ciudad)', inv.work_address)}
          <div><label className={ui.lbl}>Fecha</label><input name="issued_at" type="date" defaultValue={inv.issued_at} className={ui.inp} /></div>
          {text('due_text', 'Vence', inv.due_text)}
          <div><label className={ui.lbl}>Estado</label>
            <select name="status" defaultValue={inv.status} className={ui.inp}>{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        </div>

        <h2 className="font-semibold mb-2 mt-4">Conceptos (hasta 8)</h2>
        <div className="hidden md:grid grid-cols-[1fr_80px_80px_140px_130px] gap-2 text-xs text-slate-500 mb-1"><span>Concepto</span><span>Unidad</span><span>Cantidad</span><span>Valor unitario</span><span>Valor total</span></div>
        {Array.from({ length: 8 }).map((_, i) => {
          const r = items[i]
          return (
            <div key={i} className="grid grid-cols-2 md:grid-cols-[1fr_80px_80px_140px_130px] gap-2 mb-2 items-center">
              <input name={`d${i}`} defaultValue={r?.description ?? ''} placeholder={`Concepto ${i + 1}`} className={ui.inp + ' col-span-2 md:col-span-1'} />
              <input name={`u${i}`} defaultValue={r?.unit ?? ''} placeholder="glb" className={ui.inp} />
              <input name={`q${i}`} type="number" step="0.01" min="0" defaultValue={r?.qty ?? ''} className={ui.inp} />
              <input name={`p${i}`} type="number" min="0" defaultValue={r?.unit_price ?? ''} className={ui.inp} />
              <span className="text-sm">{r ? cop(Math.round(Number(r.qty) * Number(r.unit_price))) : ''}</span>
            </div>
          )
        })}

        <div className={ui.grid + ' mt-4'}>
          <div><label className={ui.lbl}>IVA (%)</label><input name="tax_percent" type="number" step="0.01" min="0" defaultValue={inv.tax_percent} className={ui.inp} /></div>
          <div><label className={ui.lbl}>Abonos recibidos (COP)</label><input name="advances" type="number" min="0" defaultValue={inv.advances} className={ui.inp} /></div>
          {inv.work_order_id && (
            <label className="flex items-center gap-2 text-sm self-end pb-2"><input type="checkbox" name="recalc" /> Actualizar abonos desde los pagos registrados</label>
          )}
        </div>
        <p className="text-sm mb-4">Subtotal {cop(Number(inv.subtotal))} · IVA {cop(Number(inv.tax))} · Abonos {cop(Number(inv.advances))} · <b>Total a pagar {cop(Number(inv.total) - Number(inv.advances))}</b></p>

        <h2 className="font-semibold mb-2">Forma de pago</h2>
        <div className={ui.grid}>
          {text('payment_means', 'Medios (cuenta o número)', inv.payment_means, true)}{text('payee', 'A nombre de', inv.payee, true)}
          {text('note', 'Nota', inv.note, true)}{text('footer', 'Mensaje del pie', inv.footer, true)}
        </div>
        <button className={ui.btn}>Guardar cambios</button>
      </form>

      {profile.role === 'administrador' && (
        <form action={deleteInvoice}><input type="hidden" name="id" value={id} /><ConfirmAction label="Eliminar esta cuenta de cobro" message="¿Eliminar esta cuenta de cobro?" /></form>
      )}
    </>
  )
}
