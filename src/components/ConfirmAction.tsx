'use client'

export default function ConfirmAction({ label, message, className }: { label: string; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className ?? 'inline-block bg-white text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50'}
      onClick={(e) => { if (!confirm(message)) e.preventDefault() }}
    >
      {label}
    </button>
  )
}
