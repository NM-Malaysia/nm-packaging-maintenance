import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serverSecret =
    process.env.SUPABASE_SERVER_SECRET_KEY;

  if (!supabaseUrl || !serverSecret) {
    throw new Error(
      "Missing Supabase server configuration."
    );
  }

  return createClient(supabaseUrl, serverSecret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}