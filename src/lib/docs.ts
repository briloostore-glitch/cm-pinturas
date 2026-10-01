import type { SupabaseClient } from '@supabase/supabase-js'

export type Company = { name: string; owner: string; nit: string; contact: string; location: string }
export type InvoiceDefaults = { payment_means: string; payee: string; note: string; due_text: string; footer: string }

const COMPANY: Company = {
  name: 'CM Pinturas y Mantenimiento', owner: 'Carlos Andrés Montaño Cuero', nit: '1111775242-5',
  contact: 'WhatsApp: 315 565 4948 | mcuero12@hotmail.com', location: 'Pereira, Risaralda, Colombia',
}
const INVOICE: InvoiceDefaults = {
  payment_means: '', payee: '', note: 'Persona natural. Régimen tributario:', due_text: 'Contra entrega',
  footer: 'Gracias por confiar en CM Pinturas y Mantenimiento',
}

async function read<T>(supabase: SupabaseClient, key: string, fallback: T): Promise<T> {
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  return { ...fallback, ...((data?.value as object) ?? {}) }
}
export const getCompany = (s: SupabaseClient) => read(s, 'company', COMPANY)
export const getInvoiceDefaults = (s: SupabaseClient) => read(s, 'invoice_defaults', INVOICE)

export const KIND_LABEL: Record<string, string> = {
  casa: 'casa', apartamento: 'apartamento', local: 'local comercial', oficina: 'oficina', otro: 'inmueble',
}

// Texto inicial de la carta. Después se edita libremente (**texto** = negrilla)
export function letterBody(opts: { work: string; kind: string }) {
  return [
    `Por medio de la presente nos permitimos presentar la cotización para realizar los trabajos de **pintura y mantenimiento ${opts.work}**, de acuerdo con las necesidades identificadas en el inmueble.`,
    `El servicio contempla la **preparación de las superficies, resanes y corrección de imperfecciones, aplicación de pintura y retoques necesarios**, además de las labores de mantenimiento previamente acordadas. Durante el trabajo se protegerán las áreas intervenidas y se mantendrá el espacio organizado y limpio.`,
    `Nuestro compromiso es realizar el trabajo con **calidad, responsabilidad y cumplimiento**, procurando entregar acabados uniformes y una excelente presentación del ${opts.kind}.`,
    `Agradecemos la oportunidad y la confianza depositada en **CM Pinturas y Mantenimiento**. Quedamos atentos a cualquier inquietud o ajuste que desee realizar sobre la propuesta.`,
    `Quedo atento a cualquier inquietud y agradezco su tiempo y confianza.`,
  ].join('\n\n')
}
