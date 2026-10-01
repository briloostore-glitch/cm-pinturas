'use client'

export default function PrintButton() {
  return <button className="btn btn-o print:hidden" onClick={() => window.print()}>Imprimir / Guardar PDF</button>
}