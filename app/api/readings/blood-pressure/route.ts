import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBpStatus } from "@/lib/status";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const patient = await prisma.patient.findUnique({
    where: { profileId: user.profile.id },
  });
  if (!patient) return NextResponse.json({ error: "Patient record not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Number(searchParams.get("offset") ?? 0);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    patientId: patient.id,
    ...(from || to
      ? { recordedAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {}),
  };

  const [readings, total] = await Promise.all([
    prisma.bloodPressureReading.findMany({ where, orderBy: { recordedAt: "desc" }, take: limit, skip: offset }),
    prisma.bloodPressureReading.count({ where }),
  ]);

  return NextResponse.json({
    readings: readings.map((r) => ({ ...r, status: getBpStatus(r.systolic, r.diastolic) })),
    total,
  });
}

const postSchema = z.object({
  systolic: z.number().int().min(40).max(300),
  diastolic: z.number().int().min(20).max(200),
  pulse: z.number().int().positive().optional(),
  arm: z.enum(["LEFT", "RIGHT"]).default("LEFT"),
  notes: z.string().optional(),
  recordedAt: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
  }

  const patient = await prisma.patient.findUnique({ where: { profileId: user.profile.id } });
  if (!patient) return NextResponse.json({ error: "Patient record not found" }, { status: 404 });

  const { recordedAt, ...data } = parsed.data;
  const reading = await prisma.bloodPressureReading.create({
    data: { ...data, patientId: patient.id, recordedAt: recordedAt ? new Date(recordedAt) : new Date() },
  });

  return NextResponse.json({ reading: { ...reading, status: getBpStatus(reading.systolic, reading.diastolic) } }, { status: 201 });
}
