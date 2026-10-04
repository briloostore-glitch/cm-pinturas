'use client'

export default function ImprimirPeriodoButton({ n }: { n: number }) {
  return (
    <button
      type="button"
      className="btn btn-g"
      onClick={() => {
        const limpiar = () => {
          delete document.body.dataset.imprimir
          window.removeEventListener('afterprint', limpiar)
        }
        window.addEventListener('afterprint', limpiar)
        document.body.dataset.imprimir = String(n)
        window.print()
      }}
    >
      Imprimir
    </button>
  )
}