'use client'

export default function ContratoPrintButton() {
  return (
    <button type="button" className="btn" onClick={() => window.print()}>
      Imprimir contrato
    </button>
  )
}