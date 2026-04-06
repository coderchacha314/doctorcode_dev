import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { getBpStatus } from "@/lib/status";

async function getReadingForPatient(id: string, profileId: string) {
  const patient = await prisma.patient.findUnique({ where: { profileId } });
  if (!patient) return null;
  return prisma.bloodPressureReading.findFirst({ where: { id, patientId: patient.id } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const reading = await getReadingForPatient(params.id, user.profile.id);
  if (!reading) return NextResponse.json({ error: "Reading not found" }, { status: 404 });

  return NextResponse.json({ reading: { ...reading, status: getBpStatus(reading.systolic, reading.diastolic) } });
}

const patchSchema = z.object({
  notes: z.string().optional(),
  pulse: z.number().int().positive().optional(),
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

  const updated = await prisma.bloodPressureReading.update({ where: { id: params.id }, data: parsed.data });

  return NextResponse.json({ reading: { ...updated, status: getBpStatus(updated.systolic, updated.diastolic) } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const existing = await getReadingForPatient(params.id, user.profile.id);
  if (!existing) return NextResponse.json({ error: "Reading not found" }, { status: 404 });

  await prisma.bloodPressureReading.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
