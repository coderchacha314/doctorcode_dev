import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEV_TOKEN, DEV_COOKIE, DEV_DOCTOR } from "@/lib/doctor/devBypass";

export const dynamic = "force-dynamic";

/**
 * POST /api/doctor/auth/ensure-profile
 * Called after doctor signs in with email/password.
 * Verifies the profile exists and has DOCTOR role.
 * Returns { success, doctorId, fullName }.
 */
export async function POST(): Promise<NextResponse> {
  // Dev bypass
  if (process.env.NEXT_PUBLIC_DEV_DOCTOR_BYPASS === "true") {
    return NextResponse.json({ success: true, ...DEV_DOCTOR });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { supabaseId: user.id },
      include: { doctor: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found. Please register as a doctor first." }, { status: 404 });
    }

    if (profile.role !== "DOCTOR") {
      return NextResponse.json({ error: "This account is not a doctor account." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      doctorId: profile.doctor?.id,
      fullName: profile.fullName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Internal error", detail: message }, { status: 500 });
  }
}
