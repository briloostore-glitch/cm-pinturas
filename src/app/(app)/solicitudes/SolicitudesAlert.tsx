'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SolicitudesAlert({ ultima }: { ultima: string }) {
  const router = useRouter()
  const prev = useRef(ultima)
  const ctx = useRef<AudioContext | null>(null)
  const [on, setOn] = useState(false)

  function beep() {
    const c = ctx.current
    if (!c) return
    for (let i = 0; i < 6; i++) {
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'square'
      o.frequency.value = i % 2 ? 660 : 990
      g.gain.value = 1
      o.connect(g)
      g.connect(c.destination)
      o.start(c.currentTime + i * 0.3)
      o.stop(c.currentTime + i * 0.3 + 0.22)
    }
  }

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 15000)
    return () => clearInterval(t)
  }, [router])

  useEffect(() => {
    if (ultima && ultima > prev.current && on) beep()
    if (ultima > prev.current) prev.current = ultima
  }, [ultima, on])

  return (
    <div className="mb-4">
      {on ? (
        <span className="text-sm text-green-700">Sonido activado: suena al llegar una solicitud nueva</span>
      ) : (
        <button
          className="btn btn-o"
          onClick={() => {
            ctx.current = new AudioContext()
            ctx.current.resume()
            setOn(true)
            beep()
          }}
        >
          Activar sonido de alerta
        </button>
      )}
    </div>
  )
}