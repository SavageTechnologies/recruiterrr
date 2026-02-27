import 'server-only'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─── LAZY SINGLETON ───────────────────────────────────────────────────────────
// createClient() is deferred until first use inside a request handler.
// This prevents Vercel from crashing during module bootstrap before env vars
// are injected — the root cause of the "Neither apiKey nor config.authenticator"
// error that started with the Stripe integration.
//
// IMPORTANT: This client uses `any` for the Database generic because this project
// has not yet generated Supabase TypeScript types. TypeScript will not catch
// column name typos or type mismatches until you run:
//
//   npx supabase login
//   npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public \
//     > types/database.types.ts
//
// Then update this file to: createClient<Database>(url, key)
// and import Database from '@/types/database.types'
//
// Your project ID is in: Supabase Dashboard → Settings → General → Reference ID

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabase(): SupabaseClient<any> {
  if (!_client) {
    _client = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _client
}

// Re-export as `supabase` so all existing `import { supabase }` calls work unchanged.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> = new Proxy({} as SupabaseClient<any>, {
  get(_target, prop: string | symbol) {
    return (getSupabase() as any)[prop]
  }
})
