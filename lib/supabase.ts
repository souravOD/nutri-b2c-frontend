// lib/supabase.ts
// Supabase client for Realtime subscriptions (PRD-29 Phase 7)
// Uses anon key — RLS policies MUST be enabled on accessed tables
// ─────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey, {
            realtime: {
                params: { eventsPerSecond: 2 },
            },
        })
        : null;
