import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEV_TOKEN, DEV_COOKIE } from "@/lib/doctor/devBypass";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["PROGRESS", "DIAGNOSIS", "TREATMENT", "FOLLOW_UP", "REFERRAL"]).default("PROGRESS"),
});

async function getDoctor(supabaseUserId: string) {
  return prisma.doctor.findFirst({ where: { profile: { supabaseId: supabaseUserId } } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { patientId: string } }
): Promise<NextResponse> {
  if (process.env.NEXT_PUBLIC_DEV_DOCTOR_BYPASS === "true") return NextResponse.json({ notes: [] });
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doctor = await getDoctor(user.id);
  if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 403 });

  const { patientId } = params;

  const notes = await prisma.medicalNote.findMany({
    where: { patientId, doctorId: doctor.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { patientId: string } }
): Promise<NextResponse> {
  if (process.env.NEXT_PUBLIC_DEV_DOCTOR_BYPASS === "true") {
    const body = await req.json();
    return NextResponse.json({
      note: { id: `note-${Date.now()}`, ...body, createdAt: new Date().toISOString() },
    }, { status: 201 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doctor = await getDoctor(user.id);
  if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 403 });

  const { patientId } = params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const note = await prisma.medicalNote.create({
    data: {
      patientId,
      doctorId: doctor.id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
