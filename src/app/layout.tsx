import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CM Pinturas y Mantenimiento',
  description: 'Sistema de gestión de CM Pinturas y Mantenimiento',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
