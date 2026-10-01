'use client'

export default function DeleteButton() {
  return (
    <button
      className="btn btn-g"
      onClick={(e) => {
        if (!confirm('Eliminar esta solicitud? No se puede deshacer. El cliente o la visita ya creados no se borran.')) e.preventDefault()
      }}
    >
      Eliminar
    </button>
  )
}