import type { ReactNode } from 'react'

const P: Record<string, ReactNode> = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  panel: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  clientes: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.5" /><path d="M17.5 14.2c2.4.3 4 2.1 4 4.8" /></>,
  cotizaciones: <><rect x="5" y="2.5" width="14" height="19" rx="2" /><rect x="8" y="5.5" width="8" height="3.5" rx=".5" /><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" /></>,
  visitas: <><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4M8 14h.01M12 14h.01M16 14h.01" /></>,
  trabajos: <><rect x="3" y="3" width="15" height="6" rx="1.5" /><path d="M18 6h2.5a.5.5 0 0 1 .5.5V11a1 1 0 0 1-1 1H11v3" /><rect x="9" y="15" width="4" height="6" rx="1" /></>,
  inventario: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
  proveedores: <><path d="M2 5.5h11V16H2z" /><path d="M13 9.5h4.5l3.5 3.5v3H13z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  personal: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2.2" /><path d="M5.5 16.5c.6-1.7 2-2.5 3.5-2.5s2.9.8 3.5 2.5M14.5 10h4M14.5 13.5h3" /></>,
  nomina: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.8" /><path d="M6 12h.01M18 12h.01" /></>,
  gastos: <><path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  facturacion: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6.5 15h4" /></>,
  reportes: <><path d="M3 3v18h18" /><path d="M8 17v-6M13 17V7M18 17v-9" /></>,
  precios: <><path d="M3 3h8.5L21 12.5 12.5 21 3 11.5z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  usuarios: <><path d="M12 2.5 4 5.5v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10v-6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
}

export default function Icon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {P[name] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  )
}