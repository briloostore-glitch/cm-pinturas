import { notFound } from 'next/navigation'
import { guard } from '@/lib/guard'
import { longDate } from '@/lib/words'
import { getCompany } from '@/lib/docs'
import PrintBar from '@/components/PrintBar'
import Rich from '@/components/Rich'
import '@/styles/doc.css'

export default async function ImprimirCarta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await guard('facturacion')
  const { data: l } = await supabase.from('letters').select('*').eq('id', id).single()
  if (!l) notFound()
  const C = await getCompany(supabase)
  const whatsapp = C.contact.split('|')[0].trim()
  const city = C.location.replace(', Risaralda', '')

  return (
    <>
      <PrintBar back={`/facturacion/cartas/${id}`} />
      <div className="lt">
        <div className="dh">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" />
          <div style={{ flex: 1 }}>
            <div className="cn">{C.name.toUpperCase()}</div>
            <div className="sm"><b>{C.owner}</b></div>
            <div className="sm">NIT: {C.nit}</div>
            <div className="sm">{C.contact} | {city}</div>
          </div>
        </div>

        <p>{l.place}, {longDate(l.letter_date)}</p>
        <p>Señores</p>
        <p style={{ marginBottom: 20 }}><b>{l.recipient}</b><br />{l.recipient_title}<br /><br />{l.location_line}</p>
        <p style={{ margin: '24px 0' }}><b>Asunto:</b> <Rich text={l.subject ?? ''} inline /></p>
        <p>{l.greeting}</p>
        <Rich text={l.body ?? ''} />
        <p style={{ marginBottom: 4 }}>Atentamente</p>
        <div className="sig">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/firma.png" alt="" /></div>
        <p style={{ margin: '6px 0 0' }}><b>{C.owner}</b><br />{C.name}<br />NIT: {C.nit} | {whatsapp}</p>

        <div className="lf"><b>{l.footer_title}</b><span>{l.footer_line}</span></div>
      </div>
    </>
  )
}
