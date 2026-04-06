import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/ensure-profile
 *
 * Called after client-side OTP verification (email or SMS).
 * Creates the Prisma Profile + Patient row for new users.
 * Returns { success, onboardingComplete, role }.
 */
export async function POST(): Promise<NextResponse> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Backend not configured. Add Supabase credentials to .env.local" },
      { status: 503 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let profile = await prisma.profile.findUnique({
    where: { supabaseId: user.id },
    include: { patient: true },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        supabaseId: user.id,
        email: user.email ?? null,           // null for phone-only users
        mobile: user.phone ?? null,          // E.164 phone for SMS users
        fullName: user.user_metadata?.full_name ?? "New User",
        gender: user.user_metadata?.gender ?? null,
        role: "PATIENT",
        patient: { create: {} },
      },
      include: { patient: true },
    });
  }

  return NextResponse.json({
    success: true,
    onboardingComplete: profile.patient?.onboardingComplete ?? false,
    role: profile.role,
  });
}
