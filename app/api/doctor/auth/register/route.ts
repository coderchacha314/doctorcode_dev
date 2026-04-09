import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  specialty: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Backend not configured" },
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
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { fullName, email, password, specialty } = parsed.data;

  const service = await createSupabaseServiceClient();

  // Create Supabase user with auto-confirm via admin API
  const { data: userData, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "DOCTOR", specialty: specialty ?? null },
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  const userId = userData.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  try {
    // Check if profile already exists (idempotent)
    const existing = await prisma.profile.findUnique({ where: { supabaseId: userId } });
    if (!existing) {
      await prisma.profile.create({
        data: {
          supabaseId: userId,
          email,
          fullName,
          role: "DOCTOR",
          doctor: { create: { specialty: specialty ?? null } },
        },
      });
    }
  } catch (err) {
    // Clean up Supabase user if Prisma fails
    await service.auth.admin.deleteUser(userId);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Profile creation failed", detail: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
