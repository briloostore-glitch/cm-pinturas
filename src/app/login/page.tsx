import Image from 'next/image'
import { login } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f5f9] p-4">
      <form action={login} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4 border border-slate-200">
        <Image src="/logo.png" alt="CM Pinturas y Mantenimiento" width={200} height={200} className="mx-auto h-32 w-auto" priority />
        <h1 className="text-center text-lg font-semibold text-navy">Ingreso al sistema</h1>
        {error && (
          <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2" role="alert">
            Correo o contraseña incorrectos.
          </p>
        )}
        <label className="block text-sm text-slate-600">
          Correo
          <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" />
        </label>
        <label className="block text-sm text-slate-600">
          Contraseña
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" />
        </label>
        <button className="w-full rounded-lg bg-navy text-white font-semibold py-2.5 hover:opacity-90">Entrar</button>
      </form>
    </main>
  )
}
