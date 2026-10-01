'use client'

export default function ConfirmSubmit({ label, message, className = 'btn btn-g' }: { label: string; message: string; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault() }}>
      {label}
    </button>
  )
}