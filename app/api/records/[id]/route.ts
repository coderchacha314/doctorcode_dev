import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const patient = await prisma.patient.findUnique({
    where: { profileId: user.profile.id },
  });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const record = await prisma.medicalRecord.findFirst({
    where: { id: params.id, patientId: patient.id },
  });
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  await prisma.medicalRecord.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
