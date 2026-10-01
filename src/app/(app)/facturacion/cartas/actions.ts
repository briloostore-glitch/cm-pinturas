'use server'

import { redirect } from 'next/navigation'
import { guard } from '@/lib/guard'
import { KIND_LABEL, letterBody } from '@/lib/docs'
import { msg, today } from '@/lib/money'

const t = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

type Q = {
  id: string; client_id: string; city: string | null
  clients: { first_name: string; last_name: string | null } | null
  properties: { kind: string; address: string | null } | null
}

export async function createLetter(fd: FormData) {
  const { supabase } = await guard('facturacion')
  const qid = t(fd, 'quote_id')
  let row: Record<string, unknown> = {
    letter_date: today(), place: 'Pereira', recipient: '', recipient_title: 'Propietario(a)', location_line: 'Pereira-Risaralda',
    subject: 'Cotización pintura y mantenimiento', greeting: 'Cordial saludo,', body: letterBody({ work: 'del inmueble', kind: 'inmueble' }),
  }
  if (qid) {
    const { data } = await supabase.from('quotes').select('id,client_id,city,clients(first_name,last_name),properties(kind,address)').eq('id', qid).single()
    const q = data as unknown as Q | null
    if (!q) redirect('/facturacion/cartas?error=' + msg('No se encontró la cotización'))
    const kind = KIND_LABEL[q!.properties?.kind ?? 'otro'] ?? 'inmueble'
    const address = q!.properties?.address?.trim()
    const name = `${q!.clients?.first_name ?? ''} ${q!.clients?.last_name ?? ''}`.trim()
    const work = address ? `del **${address}**` : `del ${kind}`
    row = {
      ...row, quote_id: qid, client_id: q!.client_id, recipient: name,
      location_line: q!.city && q!.city !== 'Otra' ? `${q!.city}-Risaralda` : 'Risaralda',
      subject: `Cotización pintura y mantenimiento ${kind}` + (address ? ` **${address}**` : ''),
      greeting: `Cordial saludo, señor(a) ${q!.clients?.first_name ?? ''}:`,
      body: letterBody({ work: work.replace(/\*\*/g, ''), kind }),
    }
    // la negrilla del texto principal: se deja solo en la frase clave del cuerpo
  }
  const { data: l, error } = await supabase.from('letters').insert(row).select('id').single()
  if (error || !l) redirect('/facturacion/cartas?error=' + msg('No se pudo crear la carta: ' + (error?.message ?? '')))
  redirect(`/facturacion/cartas/${l!.id}`)
}

export async function saveLetter(fd: FormData) {
  const { supabase } = await guard('facturacion')
  const id = t(fd, 'id')
  await supabase.from('letters').update({
    place: t(fd, 'place'), letter_date: t(fd, 'letter_date') || today(), recipient: t(fd, 'recipient'),
    recipient_title: t(fd, 'recipient_title'), location_line: t(fd, 'location_line'), subject: t(fd, 'subject'),
    greeting: t(fd, 'greeting'), body: String(fd.get('body') ?? '').trim(),
    footer_title: t(fd, 'footer_title'), footer_line: t(fd, 'footer_line'),
  }).eq('id', id)
  redirect(`/facturacion/cartas/${id}?ok=1`)
}

export async function deleteLetter(fd: FormData) {
  const { supabase } = await guard('facturacion')
  await supabase.from('letters').delete().eq('id', t(fd, 'id'))
  redirect('/facturacion/cartas')
}
