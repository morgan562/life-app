import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  console.log("[/auth/callback] hit", request.url);
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieNames = cookieHeader
    .split(";")
    .map((part) => part.trim().split("=", 1)[0])
    .filter(Boolean);
  console.log("[/auth/callback] incoming cookies:", cookieNames);
  console.log("[/auth/callback] code present:", Boolean(code));

  if (!code) {
    console.log("[/auth/callback] NO_CODE");
    return NextResponse.redirect(new URL("/login", url));
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  console.log("[/auth/callback] exchange success:", !error);

  if (error) {
    console.error("[/auth/callback] exchange error", error);
    const reason = encodeURIComponent(error.message ?? "unknown");
    return NextResponse.redirect(new URL(`/login?e=callback_failed&reason=${reason}`, url));
  }

  return NextResponse.redirect(new URL("/app", url));
}
