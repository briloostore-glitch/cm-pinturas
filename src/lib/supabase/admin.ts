import { createClient } from '@supabase/supabase-js'

// Solo para rutas de servidor sin sesion (webhook). Nunca importar en componentes de cliente.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}