import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEV_TOKEN, DEV_COOKIE, DEV_PATIENT_DETAIL } from "@/lib/doctor/devBypass";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { patientId: string } }
): Promise<NextResponse> {
  // Dev bypass — must come before any Supabase/Prisma calls
  if (process.env.NEXT_PUBLIC_DEV_DOCTOR_BYPASS === "true") {
    const { patientId } = params;
    const patient = DEV_PATIENT_DETAIL[patientId as keyof typeof DEV_PATIENT_DETAIL];
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    return NextResponse.json({ patient });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doctor = await prisma.doctor.findFirst({
    where: { profile: { supabaseId: user.id } },
  });
  if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 403 });

  const { patientId } = params;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      profile: { select: { fullName: true, email: true, gender: true, avatarUrl: true } },
      bloodSugarReadings: { orderBy: { recordedAt: "desc" }, take: 5 },
      bpReadings: { orderBy: { recordedAt: "desc" }, take: 5 },
      kidneyReadings: { orderBy: { recordedAt: "desc" }, take: 1 },
      liverReadings: { orderBy: { recordedAt: "desc" }, take: 1 },
      prescriptions: {
        where: { doctorId: doctor.id },
        orderBy: { issuedAt: "desc" },
        take: 20,
      },
      medicalNotes: {
        where: { doctorId: doctor.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      orderedTests: {
        where: { doctorId: doctor.id },
        orderBy: { orderedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  return NextResponse.json({
    patient: {
      id: patient.id,
      mrNumber: `MR-${patient.id.slice(0, 8).toUpperCase()}`,
      fullName: patient.profile.fullName,
      email: patient.profile.email,
      gender: patient.profile.gender,
      avatarUrl: patient.profile.avatarUrl,
      dateOfBirth: patient.dateOfBirth,
      weight: patient.weight,
      height: patient.height,
      bloodType: patient.bloodType,
      pastMedicalHistory: patient.pastMedicalHistory,
      currentMedications: patient.currentMedications,
      bloodSugarReadings: patient.bloodSugarReadings,
      bpReadings: patient.bpReadings,
      kidneyReadings: patient.kidneyReadings,
      liverReadings: patient.liverReadings,
      prescriptions: patient.prescriptions,
      medicalNotes: patient.medicalNotes,
      orderedTests: patient.orderedTests,
    },
  });
}
