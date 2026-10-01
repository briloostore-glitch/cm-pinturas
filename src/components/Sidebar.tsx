'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { logout } from '@/app/login/actions'

type Item = { slug: string; label: string; icon: string }

export default function Sidebar({ items, name, role }: { items: Item[]; name: string; role: string }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="print:hidden md:hidden flex items-center gap-3 bg-navy text-white px-4 py-3 sticky top-0 z-20">
        <button onClick={() => setOpen(!open)} aria-label="Abrir menú" className="text-2xl leading-none">☰</button>
        <b>CM Pinturas y Mantenimiento</b>
      </div>
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`print:hidden bg-navy text-white w-64 shrink-0 p-4 flex flex-col fixed md:sticky top-0 h-screen z-40 transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="bg-white rounded-lg p-2 mb-4">
          <Image src="/logo.png" alt="CM Pinturas y Mantenimiento" width={200} height={200} className="mx-auto h-28 w-auto" priority />
        </div>
        <nav className="flex-1 overflow-y-auto space-y-1">
          {items.map((i) => {
            const href = '/' + i.slug
            const on = path === href || path.startsWith(href + '/')
            return (
              <Link
                key={i.slug}
                href={href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm ${on ? 'bg-accent text-black font-semibold' : 'text-slate-200 hover:bg-white/10'}`}
              >
                {i.icon} {i.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-white/20 pt-3 text-sm">
          <div className="font-semibold truncate">{name}</div>
          <div className="text-slate-300 text-xs mb-2">{role}</div>
          <form action={logout}>
            <button className="w-full rounded-lg border border-white/30 py-1.5 hover:bg-white/10">Cerrar sesión</button>
          </form>
        </div>
      </aside>
    </>
  )
}
