import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireModule } from '@/lib/auth'
import { cop } from '@/lib/money'
import { hora, listarObras } from '@/lib/avances'
import ContratoPrintButton from '@/components/ContratoPrintButton'
import ContratoFirmadoInput from '@/components/ContratoFirmadoInput'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import { annulContract, deleteContract, firmContract, uploadSigned } from '../actions'

const ESTADO: Record<string, string> = { borrador: 'Borrador', firmado: 'En firme', anulado: 'Anulado' }

const fecha = (d: string | null) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

const raya = '______________________'

const PRINT_CSS = `
@media print {
  html, body { height: auto !important; overflow: visible !important; }
  * { overflow: visible !important; max-height: none !important; }
  body * { visibility: hidden !important; }
  #contrato, #contrato * { visibility: visible !important; }
  #contrato { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; box-shadow: none !important; border: none !important; }
}
`

export default async function ContratoDetalle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  const { supabase } = await requireModule('contratos')

  const { data: c } = await supabase.from('work_contracts').select('*').eq('id', id).single()
  if (!c) notFound()
  const { data: e } = await supabase.from('employees').select('*').eq('id', c.employee_id).single()
  const { obras } = await listarObras(supabase)
  const obra = obras.find((o) => o.id === c.work_order_id)

  let urlFirmada = ''
  if (c.signed_path) {
    const { data: s } = await supabase.storage.from('contratos').createSignedUrl(c.signed_path, 3600)
    urlFirmada = s?.signedUrl ?? ''
  }

  const num = String(c.seq).padStart(3, '0')
  const cuenta = e?.account_number
    ? [e.bank_name, e.account_type, 'No. ' + e.account_number].filter(Boolean).join(' - ')
    : ''

  return (
    <>
      <style>{PRINT_CSS}</style>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h1 className="text-2xl font-bold text-navy">Contrato {num}</h1>
        <div className="flex gap-2 items-center">
          <span className="badge">{ESTADO[c.status] ?? c.status}</span>
          <Link href="/contratos" className="btn btn-g">Volver</Link>
        </div>
      </div>
      {error && <div className="err">{error}</div>}

      <div className="card">
        {c.status === 'borrador' && (
          <>
            <p className="text-sm mb-2">
              Paso 1: imprime el contrato y f&iacute;rmenlo las dos partes. Paso 2: sube la copia firmada. Paso 3: d&eacute;jalo en firme.
            </p>
            <div className="flex flex-wrap gap-2 mb-3"><ContratoPrintButton /></div>
            <form action={uploadSigned} className="mb-3">
              <input type="hidden" name="id" value={c.id} />
              <ContratoFirmadoInput />
              <button type="submit" className="btn btn-o">Subir copia firmada</button>
            </form>
            {urlFirmada && (
              <p className="text-sm mb-2">Copia firmada subida: <a href={urlFirmada} target="_blank" rel="noreferrer" className="underline">ver copia</a></p>
            )}
            <div className="flex flex-wrap gap-2">
              {c.signed_path && (
                <form action={firmContract}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmSubmit label="Dejar en firme" message="&iquest;Dejar en firme este contrato? Despu&eacute;s no se podr&aacute; modificar ni borrar, solo anular." />
                </form>
              )}
              <form action={deleteContract}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmSubmit label="Eliminar borrador" message="&iquest;Eliminar este borrador?" />
              </form>
            </div>
          </>
        )}
        {c.status === 'firmado' && (
          <>
            <p className="text-sm mb-2">
              <b>En firme</b>{c.signed_at ? ' desde ' + hora(c.signed_at) : ''}. Ya no se puede modificar ni borrar.
              {urlFirmada && <> <a href={urlFirmada} target="_blank" rel="noreferrer" className="underline">Ver copia firmada</a></>}
            </p>
            <div className="flex flex-wrap gap-2">
              <ContratoPrintButton />
              <form action={annulContract}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmSubmit label="Anular contrato" message="&iquest;Anular este contrato? No se puede deshacer." />
              </form>
            </div>
          </>
        )}
        {c.status === 'anulado' && <p className="text-sm">Este contrato est&aacute; anulado y no se puede modificar.</p>}
      </div>

      <div id="contrato" className="card" style={{ background: '#fff', lineHeight: 1.6 }}>
        <h2 className="text-center font-bold" style={{ fontSize: 18 }}>CM PINTURAS Y MANTENIMIENTO</h2>
        <h3 className="text-center font-bold mb-1">CONTRATO DE PRESTACI&Oacute;N DE SERVICIOS POR OBRA N.&deg; {num}</h3>
        <p className="text-center text-sm mb-4">Fecha de elaboraci&oacute;n: {fecha(String(c.created_at).slice(0, 10))}</p>

        <p><b>EL CONTRATANTE:</b> CM Pinturas y Mantenimiento, NIT {raya}, representada por {raya}.</p>
        <p><b>EL CONTRATISTA:</b> {e?.full_name ?? ''}, identificado(a) con documento n&uacute;mero {e?.document || raya}, tel&eacute;fono {e?.phone || raya}.</p>
        <p className="mt-2">Las partes acuerdan celebrar el presente contrato, que se rige por las siguientes cl&aacute;usulas:</p>

        <p className="mt-2">
          <b>PRIMERA &ndash; OBJETO.</b> EL CONTRATISTA se obliga a ejecutar, con sus propios medios y autonom&iacute;a, la siguiente labor:{' '}
          <span style={{ whiteSpace: 'pre-line' }}>{c.object}</span>.
          {obra && <> Obra {String(obra.seq).padStart(3, '0')}{obra.cliente ? ', cliente ' + obra.cliente : ''}{obra.direccion ? ', ubicada en ' + obra.direccion : ''}.</>}
        </p>

        <p className="mt-2">
          <b>SEGUNDA &ndash; PLAZO.</b> La labor se ejecutar&aacute; desde el {fecha(c.start_date)}{c.end_date ? ' hasta el ' + fecha(c.end_date) : ' hasta la terminaci\u00f3n de la obra'}.
        </p>

        <p className="mt-2">
          <b>TERCERA &ndash; VALOR Y FORMA DE PAGO.</b> EL CONTRATANTE pagar&aacute; a EL CONTRATISTA la suma de <b>{cop(Number(c.daily_rate))}</b> por cada d&iacute;a efectivamente trabajado, seg&uacute;n el registro de asistencia en la obra.
          {cuenta ? ' El pago se har\u00e1 por transferencia a la cuenta: ' + cuenta + '.' : ' El pago se har\u00e1 a la cuenta que EL CONTRATISTA indique por escrito.'}{' '}
          Periodicidad de pago: {raya}.
        </p>

        <p className="mt-2">
          <b>CUARTA &ndash; SEGURIDAD SOCIAL.</b> EL CONTRATISTA declara estar afiliado a: EPS {e?.eps || raya}; fondo de pensi&oacute;n {e?.pension_fund || raya}; ARL {e?.arl || raya}. Se obliga a mantener sus aportes al d&iacute;a durante la ejecuci&oacute;n del contrato y a presentar el soporte cuando EL CONTRATANTE lo solicite.
        </p>

        <p className="mt-2">
          <b>QUINTA &ndash; OBLIGACIONES DEL CONTRATISTA.</b> Ejecutar la labor con calidad y en el plazo acordado; usar los elementos de protecci&oacute;n personal y cumplir las normas de seguridad; cuidar los materiales, herramientas y bienes del cliente; informar de inmediato cualquier novedad o da&ntilde;o; y entregar la labor terminada y el sitio limpio.
        </p>

        <p className="mt-2">
          <b>SEXTA &ndash; OBLIGACIONES DEL CONTRATANTE.</b> Pagar oportunamente los valores pactados, permitir el acceso al sitio de la obra y suministrar la informaci&oacute;n y los materiales necesarios.
        </p>

        <p className="mt-2">
          <b>S&Eacute;PTIMA &ndash; TERMINACI&Oacute;N.</b> El contrato termina por cumplimiento del objeto, por mutuo acuerdo o por incumplimiento grave de alguna de las partes. En cualquier caso se pagar&aacute;n los d&iacute;as efectivamente trabajados hasta la terminaci&oacute;n.
        </p>

        <p className="mt-2">
          <b>OCTAVA &ndash; NATURALEZA.</b> Las partes declaran que este es un contrato de prestaci&oacute;n de servicios por obra, en el que EL CONTRATISTA act&uacute;a con autonom&iacute;a en la forma de ejecutar la labor.
        </p>

        {c.notes && (
          <p className="mt-2">
            <b>CONDICIONES ADICIONALES.</b> <span style={{ whiteSpace: 'pre-line' }}>{c.notes}</span>
          </p>
        )}

        <div className="flex justify-between gap-8" style={{ marginTop: 64 }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 4 }}>
              <b>EL CONTRATANTE</b><br />Nombre: {raya}<br />C.C.: {raya}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 4 }}>
              <b>EL CONTRATISTA</b><br />{e?.full_name ?? ''}<br />C.C.: {e?.document || raya}
            </div>
          </div>
        </div>
        <p className="text-sm" style={{ marginTop: 24 }}>Lugar y fecha de firma: {raya}</p>
      </div>
    </>
  )
}