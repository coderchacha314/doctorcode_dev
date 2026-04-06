import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // Ensure a Prisma profile exists for this Google user
  let profile = await prisma.profile.findUnique({
    where: { supabaseId: user.id },
    include: { patient: true },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        supabaseId: user.id,
        email: user.email ?? null,
        mobile: null,
        fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "New User",
        gender: null,
        role: "PATIENT",
        patient: { create: {} },
      },
      include: { patient: true },
    });
  }

  const destination = profile.patient?.onboardingComplete ? next : "/clinical-details";
  return NextResponse.redirect(`${origin}${destination}`);
}
