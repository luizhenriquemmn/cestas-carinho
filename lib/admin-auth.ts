import { createClient, type User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function getAdminUser(authorization: string | null): Promise<User | null> {
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: { user } } = await authClient.auth.getUser(token);
  if (!user?.email) return null;
  const { data: admin } = await supabaseAdmin
    .from("admin_users").select("ativo").eq("email", user.email).maybeSingle();
  return admin?.ativo ? user : null;
}
