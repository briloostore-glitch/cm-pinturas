'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Sube el comprobante directo a Supabase Storage (carpeta privada "receipts")
export default function ReceiptUpload() {
  const [path, setPath] = useState('')
  const [status, setStatus] = useState('')

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 8 * 1024 * 1024) { setStatus('El archivo pesa más de 8 MB'); e.target.value = ''; return }
    setStatus('Subiendo…')
    const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const p = `gastos/${new Date().getFullYear()}/${Date.now()}-${safe}`
    const { error } = await createClient().storage.from('receipts').upload(p, f)
    if (error) { setPath(''); setStatus('No se pudo subir: ' + error.message); return }
    setPath(p)
    setStatus('Comprobante adjunto ✓')
  }

  return (
    <div>
      <input type="hidden" name="receipt_path" value={path} />
      <input type="file" accept="image/*,application/pdf" onChange={onChange} className="w-full text-sm" />
      <p className="text-xs text-slate-500 mt-1">{status}</p>
    </div>
  )
}
