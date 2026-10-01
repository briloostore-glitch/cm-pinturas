'use client'

import Link from 'next/link'

export default function PrintBar({ back }: { back: string }) {
  return (
    <div className="flex gap-2 mb-4 print:hidden">
      <Link href={back} className="inline-block bg-white text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 text-sm">Volver / Editar</Link>
      <button onClick={() => window.print()} className="inline-block bg-accent text-black rounded-lg px-3.5 py-1.5 text-sm font-semibold cursor-pointer">
        Imprimir / Guardar PDF
      </button>
    </div>
  )
}
