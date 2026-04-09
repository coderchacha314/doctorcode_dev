import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** POST — Link a patient to the doctor's list */
export async function POST(
  _req: NextRequest,
  { params }: { params: { patientId: string } }
): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doctor = await prisma.doctor.findFirst({
    where: { profile: { supabaseId: user.id } },
  });
  if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 403 });

  const { patientId } = params;

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  // Upsert to avoid duplicate links
  await prisma.doctorPatient.upsert({
    where: { doctorId_patientId: { doctorId: doctor.id, patientId } },
    create: { doctorId: doctor.id, patientId },
    update: {},
  });

  return NextResponse.json({ success: true });
}

/** DELETE — Unlink a patient */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { patientId: string } }
): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doctor = await prisma.doctor.findFirst({
    where: { profile: { supabaseId: user.id } },
  });
  if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 403 });

  const { patientId } = params;

  await prisma.doctorPatient.deleteMany({
    where: { doctorId: doctor.id, patientId },
  });

  return NextResponse.json({ success: true });
}
