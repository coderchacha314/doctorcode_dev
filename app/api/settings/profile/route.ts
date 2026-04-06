import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<NextResponse> {
  const { user, error } = await requireAuth();
  if (error) return error;

  const profile = await prisma.profile.findUnique({
    where: { id: user.profile.id },
    include: {
      patient: {
        select: {
          id: true,
          dateOfBirth: true,
          weight: true,
          height: true,
          bloodType: true,
          pastMedicalHistory: true,
          currentMedications: true,
          onboardingComplete: true,
        },
      },
    },
  });

  return NextResponse.json({ profile });
}

const patchSchema = z.object({
  fullName: z.string().min(1).optional(),
  mobile: z.string().optional(),
  gender: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const updated = await prisma.profile.update({
    where: { id: user.profile.id },
    data: parsed.data,
  });

  return NextResponse.json({ profile: updated });
}
