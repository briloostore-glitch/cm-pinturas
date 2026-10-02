'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'

const MAX = 950000

async function reducir(file: File, lado: number, calidad: number): Promise<File> {
  const bmp = await createImageBitmap(file)
  const esc = Math.min(1, lado / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * esc)
  const h = Math.round(bmp.height * esc)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('sin canvas')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', calidad))
  if (!blob) throw new Error('sin imagen')
  return new File([blob], 'contrato-firmado.jpg', { type: 'image/jpeg' })
}

export default function ContratoFirmadoInput() {
  const [msg, setMsg] = useState('')

  async function cambio(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const f = input.files?.[0]
    setMsg('')
    if (!f) return
    if (f.type === 'application/pdf') {
      if (f.size > MAX) {
        input.value = ''
        setMsg('El PDF pesa mas de 1 MB. Toma una foto del contrato firmado o reduce el PDF.')
      }
      return
    }
    try {
      let out = await reducir(f, 1600, 0.8)
      if (out.size > MAX) out = await reducir(f, 1200, 0.65)
      if (out.size > MAX) throw new Error('grande')
      const dt = new DataTransfer()
      dt.items.add(out)
      input.files = dt.files
      setMsg('Foto lista (' + Math.round(out.size / 1024) + ' KB).')
    } catch {
      input.value = ''
      setMsg('No se pudo procesar la imagen. Intenta con otra foto.')
    }
  }

  return (
    <div className="mb-3">
      <label className="lbl">Copia firmada (foto o PDF)</label>
      <input type="file" name="file" required accept="image/jpeg,image/png,application/pdf" onChange={cambio} className="text-sm" />
      {msg && <p className="text-sm mt-1">{msg}</p>}
    </div>
  )
}