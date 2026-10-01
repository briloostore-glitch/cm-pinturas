'use client'

import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

const LADO_MAX = 1024

// Reduce la foto en el navegador (JPEG, maximo 1024 px) para que suba rapido y no pase el limite de tamaño.
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

export default function ImageInput({ url }: { url: string | null }) {
  const ref = useRef<HTMLInputElement>(null)
  const [vista, setVista] = useState<string | null>(url)
  const [quitar, setQuitar] = useState(false)
  const [msg, setMsg] = useState('')

  async function cambio(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const f = input.files?.[0]
    setMsg('')
    if (!f) { setVista(url); return }
    try {
      const r = await reducir(f)
      const dt = new DataTransfer()
      dt.items.add(r)
      input.files = dt.files
      setVista(URL.createObjectURL(r))
      setQuitar(false)
    } catch {
      if (f.size > 2 * 1024 * 1024) {
        input.value = ''
        setVista(url)
        setMsg('No se pudo procesar la foto y pesa más de 2 MB. Usa otra.')
        return
      }
      setVista(URL.createObjectURL(f))
    }
  }

  return (
    <div className="mb-4">
      <label className="lbl">Foto del material</label>
      <div className="flex items-center gap-3">
        <div className="w-24 h-24 rounded-lg border bg-slate-50 overflow-hidden flex items-center justify-center text-xs text-slate-400 shrink-0">
          {vista && !quitar ? <img src={vista} alt="Vista previa" className="w-full h-full object-cover" /> : 'Sin foto'}
        </div>
        <div>
          <input ref={ref} type="file" name="image" accept="image/jpeg,image/png,image/webp" onChange={cambio} className="text-sm" />
          {url && (
            <label className="flex items-center gap-2 text-sm mt-2">
              <input
                type="checkbox"
                name="remove_image"
                checked={quitar}
                onChange={(e) => {
                  setQuitar(e.target.checked)
                  if (e.target.checked && ref.current) { ref.current.value = ''; setVista(url) }
                }}
              />
              Quitar la foto actual
            </label>
          )}
          {msg && <p className="text-sm text-red-600 mt-1">{msg}</p>}
          <p className="text-xs text-slate-500 mt-1">JPG, PNG o WEBP. Se reduce automáticamente.</p>
        </div>
      </div>
    </div>
  )
}