import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEV_TOKEN, DEV_COOKIE } from "@/lib/doctor/devBypass";

export const dynamic = "force-dynamic";

const orderSchema = z.object({
  testName: z.string().min(1, "Test name is required"),
  category: z.string().optional(),
});

const updateSchema = z.object({
  testId: z.string().uuid(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  result: z.string().optional(),
});

async function getDoctor(supabaseUserId: string) {
  return prisma.doctor.findFirst({ where: { profile: { supabaseId: supabaseUserId } } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { patientId: string } }
): Promise<NextResponse> {
  if (process.env.NEXT_PUBLIC_DEV_DOCTOR_BYPASS === "true") return NextResponse.json({ tests: [] });
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doctor = await getDoctor(user.id);
  if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 403 });

  const { patientId } = params;

  const tests = await prisma.doctorOrderedTest.findMany({
    where: { patientId, doctorId: doctor.id },
    orderBy: { orderedAt: "desc" },
  });

  return NextResponse.json({ tests });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { patientId: string } }
): Promise<NextResponse> {
  if (process.env.NEXT_PUBLIC_DEV_DOCTOR_BYPASS === "true") {
    const body = await req.json();
    return NextResponse.json({
      test: { id: `test-${Date.now()}`, ...body, status: "PENDING", result: null, orderedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
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

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const test = await prisma.doctorOrderedTest.create({
    data: {
      patientId,
      doctorId: doctor.id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ test }, { status: 201 });
}

/** PATCH — Update test status / result */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { patientId: string } }
): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doctor = await getDoctor(user.id);
  if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 403 });

  const { patientId } = params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const { testId, status, result } = parsed.data;

  const test = await prisma.doctorOrderedTest.updateMany({
    where: { id: testId, patientId, doctorId: doctor.id },
    data: {
      status,
      result: result ?? undefined,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    },
  });

  if (test.count === 0) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
