import Link from 'next/link'

const TABS: [string, string, string][] = [
  ['pagos', 'Pagos', '/facturacion'],
  ['cuentas', 'Cuentas de cobro', '/facturacion/cuentas'],
  ['cartas', 'Cartas de presentación', '/facturacion/cartas'],
]

export default function FacturacionTabs({ active }: { active: 'pagos' | 'cuentas' | 'cartas' }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 print:hidden">
      {TABS.map(([k, l, h]) => (
        <Link key={k} href={h} className={`rounded-lg px-3 py-1.5 text-sm ${active === k ? 'bg-navy text-white' : 'bg-white border border-slate-300'}`}>{l}</Link>
      ))}
    </div>
  )
}
