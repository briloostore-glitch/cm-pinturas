'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'

const LADO_MAX = 1280
const MAX_FOTOS = 4

// Reduce cada foto en el navegador (JPEG, maximo 1280 px) para que suba rapido y no pase el limite de tamaÃ±o.
async function reducir(file: File): Promise<File> {
  const bmp = await createImageBitmap(file)
  const esc = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * esc)
  const h = Math.round(bmp.height * esc)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.82))
  if (!blob) return file
  return new File([blob], 'foto.jpg', { type: 'image/jpeg' })
}

export default function PhotosInput() {
  const [vistas, setVistas] = useState<string[]>([])
  const [msg, setMsg] = useState('')

  async function cambio(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const todas = Array.from(input.files ?? [])
    setMsg('')
    if (!todas.length) { setVistas([]); return }
    try {
      const reducidas = await Promise.all(todas.slice(0, MAX_FOTOS).map(reducir))
      const dt = new DataTransfer()
      reducidas.forEach((f) => dt.items.add(f))
      input.files = dt.files
      setVistas(reducidas.map((f) => URL.createObjectURL(f)))
      if (todas.length > MAX_FOTOS) setMsg(`Solo se suben las primeras ${MAX_FOTOS} fotos.`)
    } catch {
      input.value = ''
      setVistas([])
      setMsg('No se pudieron procesar las fotos. Intenta con otras.')
    }
  }

  return (
    <div className="mb-3">
      <label className="lbl">Fotos del avance (hasta {MAX_FOTOS})</label>
      <input type="file" name="photos" multiple accept="image/jpeg,image/png,image/webp" onChange={cambio} className="text-sm" />
      {msg && <p className="text-sm text-red-600 mt-1">{msg}</p>}
      {vistas.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {vistas.map((v) => <img key={v} src={v} alt="Vista previa" className="w-20 h-20 rounded-lg object-cover border" />)}
        </div>
      )}
    </div>
  )
}