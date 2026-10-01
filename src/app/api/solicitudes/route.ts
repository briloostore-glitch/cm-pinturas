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

  const { error } = await createAdminClient().from('requests').upsert(
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
  )
  if (error) {
    console.error('solicitudes:', error.message)
    return NextResponse.json({ error: 'no se pudo guardar' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}