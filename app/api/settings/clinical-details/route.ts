import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const patient = await prisma.patient.findUnique({
    where: { profileId: user.profile.id },
  });

  return NextResponse.json({ patient });
}

const patchSchema = z.object({
  dateOfBirth: z.string().optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  bloodType: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  gender: z.string().optional(),
  mobile: z.string().optional(),
});

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
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

  const { dateOfBirth, gender, mobile, ...patientRest } = parsed.data;

  // Update Profile fields (gender, mobile) if provided
  if (gender !== undefined || mobile !== undefined) {
    await prisma.profile.update({
      where: { id: user.profile.id },
      data: {
        ...(gender !== undefined ? { gender } : {}),
        ...(mobile !== undefined ? { mobile } : {}),
      },
    });
  }

  const patient = await prisma.patient.update({
    where: { profileId: user.profile.id },
    data: {
      ...patientRest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      onboardingComplete: true,
    },
  });

  return NextResponse.json({ patient });
}
