import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type Hook = { type?: string; table?: string; record?: Record<string, unknown> }

const s = (v: unknown, n = 300) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
const num = (v: unknown) => {
  const n = Number(v)
  return v === null || v === undefined || v === '' || Number.isNaN(n) ? null : n
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function avisoTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return
  try {
    const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.error('telegram:', res.status)
  } catch (e) {
    console.error('telegram:', e instanceof Error ? e.message : e)
  }
}
function autorizado(got: string | null) {
  const want = process.env.SOLICITUDES_SECRET
  if (!want || !got) return false
  const a = Buffer.from(got)
  const b = Buffer.from(want)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  if (!autorizado(req.headers.get('x-webhook-secret'))) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 })
  }
  let body: Hook
  try {
    body = (await req.json()) as Hook
  } catch {
    return NextResponse.json({ error: 'json invalido' }, { status: 400 })
  }

  const rec = body.record
  const siteId = process.env.CM_SITE_ID
  if (body.type !== 'INSERT' || body.table !== 'cotizaciones_cm' || !rec || !siteId || String(rec.site_id) !== siteId || !rec.id) {
    return NextResponse.json({ ok: true, ignorada: true })
  }

  const fotos = Array.isArray(rec.fotos)
    ? rec.fotos.filter((u): u is string => typeof u === 'string' && u.startsWith('https://')).slice(0, 4)
    : []

  const { data: nuevo, error } = await createAdminClient().from('requests').upsert(
    {
      source_id: String(rec.id),
      tipo_inmueble: s(rec.tipo_inmueble, 80) || null,
      tipo_otro: s(rec.tipo_otro, 120) || null,
      area_m2: num(rec.area_m2),
      servicio: s(rec.servicio, 120) || null,
      humedad: rec.humedad === true,
      ciudad: s(rec.ciudad, 80) || null,
      ciudad_otra: s(rec.ciudad_otra, 80) || null,
      direccion: s(rec.direccion, 200) || null,
      visita_diagnostico: rec.visita_diagnostico === true,
      nombre: s(rec.nombre, 120) || null,
      celular: s(rec.celular, 40) || null,
      correo: s(rec.correo, 160) || null,
      mensaje: s(rec.mensaje, 2000) || null,
      fotos,
    },
    { onConflict: 'source_id', ignoreDuplicates: true }
  ).select('id')
  if (error) {
    console.error('solicitudes:', error.message)
    return NextResponse.json({ error: 'no se pudo guardar' }, { status: 500 })
  }
  if (nuevo && nuevo.length) {
    const inmueble = (s(rec.tipo_inmueble, 80) === 'Otro' ? s(rec.tipo_otro, 120) : s(rec.tipo_inmueble, 80)) || '-'
    const ciudad = (s(rec.ciudad, 80) === 'Otra' ? s(rec.ciudad_otra, 80) : s(rec.ciudad, 80)) || '-'
    const area = num(rec.area_m2)
    const msg = s(rec.mensaje, 2000)
    await avisoTelegram(
      '<b>CM Pinturas y Mantenimiento</b>\n' +
        '<b>Solicitud de cotización</b>\n\n' +
        '<b>Cliente:</b> ' + esc(s(rec.nombre, 120) || '-') + '\n' +
        '<b>Celular:</b> ' + esc(s(rec.celular, 40) || '-') + '\n' +
        '<b>Correo:</b> ' + esc(s(rec.correo, 160) || '-') + '\n\n' +
        '<b>Servicio:</b> ' + esc(s(rec.servicio, 120) || '-') + '\n' +
        '<b>Tipo de inmueble:</b> ' + esc(inmueble) + '\n' +
        '<b>Área:</b> ' + (area != null ? area + ' m2' : '-') + '\n' +
        '<b>Humedad:</b> ' + (rec.humedad === true ? 'Sí' : 'No') + '\n\n' +
        '<b>Ciudad:</b> ' + esc(ciudad) + '\n' +
        '<b>Dirección:</b> ' + esc(s(rec.direccion, 200) || '-') + '\n' +
        '<b>Visita técnica:</b> ' + (rec.visita_diagnostico === true ? 'Sí, la pidió' : 'No') +
        (msg ? '\n\n<b>Mensaje:</b> ' + esc(msg) : '') +
        (fotos.length ? '\n\n<b>Fotos:</b>\n' + fotos.map((u, i) => (i + 1) + '. ' + esc(u)).join('\n') : '')
    )
  }
  return NextResponse.json({ ok: true })
}