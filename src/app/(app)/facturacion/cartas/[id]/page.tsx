import Link from 'next/link'
import { notFound } from 'next/navigation'
import { guard } from '@/lib/guard'
import { ui } from '@/lib/ui'
import ConfirmAction from '@/components/ConfirmAction'
import FacturacionTabs from '@/components/FacturacionTabs'
import { deleteLetter, saveLetter } from '../actions'

export default async function EditarCarta({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { id } = await params
  const { ok } = await searchParams
  const { supabase } = await guard('facturacion')
  const { data: l } = await supabase.from('letters').select('*').eq('id', id).single()
  if (!l) notFound()
  const f = (name: string, label: string, v: string | null, full = false) => (
    <div className={full ? 'col-span-full' : ''}><label className={ui.lbl}>{label}</label><input name={name} defaultValue={v ?? ''} className={ui.inp} /></div>
  )

  return (
    <>
      <FacturacionTabs active="cartas" />
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className={ui.h1}>Carta {String(l.seq).padStart(3, '0')}</h1>
        <Link href={`/facturacion/cartas/${id}/imprimir`} className={ui.btnO}>Ver hoja para imprimir</Link>
      </div>
      {ok && <div className="bg-green-50 text-green-800 rounded-lg px-3 py-2 mb-4 text-sm">Cambios guardados.</div>}
      <form action={saveLetter} className={ui.card}>
        <input type="hidden" name="id" value={id} />
        <div className={ui.grid}>
          {f('place', 'Ciudad', l.place)}
          <div><label className={ui.lbl}>Fecha</label><input name="letter_date" type="date" defaultValue={l.letter_date} className={ui.inp} /></div>
          {f('recipient', 'Señores (destinatario)', l.recipient)}{f('recipient_title', 'Cargo', l.recipient_title)}
          {f('location_line', 'Ciudad del destinatario', l.location_line)}
          {f('subject', 'Asunto', l.subject, true)}{f('greeting', 'Saludo', l.greeting, true)}
        </div>
        <label className={ui.lbl}>Texto de la carta (deja una línea en blanco entre párrafos; usa **así** para negrilla)</label>
        <textarea name="body" rows={16} defaultValue={l.body ?? ''} className={ui.inp + ' mb-3 font-mono text-sm'} />
        <div className={ui.grid}>
          {f('footer_title', 'Pie de página (línea en negrilla)', l.footer_title, true)}{f('footer_line', 'Pie de página (línea pequeña)', l.footer_line, true)}
        </div>
        <button className={ui.btn}>Guardar cambios</button>
      </form>
      <form action={deleteLetter}><input type="hidden" name="id" value={id} /><ConfirmAction label="Eliminar esta carta" message="¿Eliminar esta carta?" /></form>
    </>
  )
}
