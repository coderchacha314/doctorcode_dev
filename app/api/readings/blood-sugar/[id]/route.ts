import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBloodSugarStatus } from "@/lib/status";

async function getReadingForPatient(id: string, profileId: string) {
  const patient = await prisma.patient.findUnique({ where: { profileId } });
  if (!patient) return null;
  return prisma.bloodSugarReading.findFirst({
    where: { id, patientId: patient.id },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const reading = await getReadingForPatient(params.id, user.profile.id);
  if (!reading) return NextResponse.json({ error: "Reading not found" }, { status: 404 });

  return NextResponse.json({
    reading: { ...reading, status: getBloodSugarStatus(reading.value, reading.unit, reading.context) },
  });
}

const patchSchema = z.object({
  notes: z.string().optional(),
  context: z
    .enum(["FASTING", "POST_MEAL", "BEFORE_MEAL", "RANDOM", "BEDTIME"])
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const existing = await getReadingForPatient(params.id, user.profile.id);
  if (!existing) return NextResponse.json({ error: "Reading not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
  }

  const updated = await prisma.bloodSugarReading.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({
    reading: { ...updated, status: getBloodSugarStatus(updated.value, updated.unit, updated.context) },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const existing = await getReadingForPatient(params.id, user.profile.id);
  if (!existing) return NextResponse.json({ error: "Reading not found" }, { status: 404 });

  await prisma.bloodSugarReading.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
