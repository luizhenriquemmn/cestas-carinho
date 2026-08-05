import { supabase } from "@/lib/supabase";

export async function establishRecoverySession(): Promise<boolean> {
  const url = new URL(window.location.href);
  if (url.searchParams.get("error") || url.searchParams.get("error_code")) return false;

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return false;
    window.history.replaceState({}, "", url.pathname);
    return true;
  }

  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return false;
    window.history.replaceState({}, "", url.pathname);
    return true;
  }

  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}
