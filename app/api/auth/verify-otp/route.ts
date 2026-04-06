import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

const schema = z.object({
  contact: z.string().email(),
  token: z.string().length(6),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Backend not configured. Add Supabase credentials to .env.local" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valid email and 6-digit token are required" },
      { status: 400 }
    );
  }

  const { contact, token } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email: contact,
    token,
    type: "email",
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Invalid or expired OTP" },
      { status: 400 }
    );
  }

  // Check if Profile exists — create one for brand-new users
  let profile = await prisma.profile.findUnique({
    where: { supabaseId: data.user.id },
    include: { patient: true },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        supabaseId: data.user.id,
        email: data.user.email ?? contact,
        mobile: null,
        fullName: data.user.user_metadata?.full_name ?? "New User",
        gender: data.user.user_metadata?.gender ?? null,
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
