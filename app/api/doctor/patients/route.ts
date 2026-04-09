import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEV_TOKEN, DEV_COOKIE, DEV_PATIENTS } from "@/lib/doctor/devBypass";

export const dynamic = "force-dynamic";

/** Resolve the Doctor record for the current authenticated user */
async function getDoctor(supabaseUserId: string) {
  return prisma.doctor.findFirst({
    where: { profile: { supabaseId: supabaseUserId } },
  });
}

/**
 * GET /api/doctor/patients
 *   - No query params → list linked patients
 *   - ?mr=MR-XXXXXXXX → search any patient by MR number
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Dev bypass
  if (process.env.NEXT_PUBLIC_DEV_DOCTOR_BYPASS === "true") {
    const { searchParams } = new URL(req.url);
    const mr = searchParams.get("mr");
    if (mr) {
      const filtered = DEV_PATIENTS.filter((p) =>
        p.mrNumber.toLowerCase().includes(mr.toLowerCase().replace(/^mr-/i, ""))
      );
      return NextResponse.json({ patients: filtered });
    }
    return NextResponse.json({ patients: DEV_PATIENTS });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doctor = await getDoctor(user.id);
  if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mr = searchParams.get("mr");

  // ── Search by MR number ──────────────────────────────────────────────────
  if (mr) {
    // MR format: MR-XXXXXXXX (first 8 chars of patient UUID, uppercased)
    const prefix = mr.replace(/^MR-/i, "").toLowerCase();
    if (prefix.length < 4) {
      return NextResponse.json({ error: "MR number too short" }, { status: 400 });
    }

    const patients = await prisma.patient.findMany({
      where: { id: { startsWith: prefix } },
      include: {
        profile: { select: { fullName: true, email: true, gender: true } },
        doctors: { where: { doctorId: doctor.id }, select: { linkedAt: true } },
      },
    });

    return NextResponse.json({
      patients: patients.map((p) => ({
        id: p.id,
        mrNumber: `MR-${p.id.slice(0, 8).toUpperCase()}`,
        fullName: p.profile.fullName,
        email: p.profile.email,
        gender: p.profile.gender,
        dateOfBirth: p.dateOfBirth,
        bloodType: p.bloodType,
        isLinked: p.doctors.length > 0,
        linkedAt: p.doctors[0]?.linkedAt ?? null,
      })),
    });
  }

  // ── List linked patients ─────────────────────────────────────────────────
  const links = await prisma.doctorPatient.findMany({
    where: { doctorId: doctor.id },
    include: {
      patient: {
        include: {
          profile: { select: { fullName: true, email: true, gender: true } },
          bloodSugarReadings: { orderBy: { recordedAt: "desc" }, take: 1 },
          bpReadings: { orderBy: { recordedAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { linkedAt: "desc" },
  });

  return NextResponse.json({
    patients: links.map(({ patient, linkedAt }) => ({
      id: patient.id,
      mrNumber: `MR-${patient.id.slice(0, 8).toUpperCase()}`,
      fullName: patient.profile.fullName,
      email: patient.profile.email,
      gender: patient.profile.gender,
      dateOfBirth: patient.dateOfBirth,
      bloodType: patient.bloodType,
      linkedAt,
      latestBS: patient.bloodSugarReadings[0] ?? null,
      latestBP: patient.bpReadings[0] ?? null,
    })),
  });
}
