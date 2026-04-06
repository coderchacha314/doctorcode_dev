import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { getBloodSugarStatus } from "@/lib/status";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const patient = await prisma.patient.findUnique({
    where: { profileId: user.profile.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Number(searchParams.get("offset") ?? 0);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const context = searchParams.get("context") as string | null;

  const where = {
    patientId: patient.id,
    ...(from || to
      ? {
          recordedAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(context ? { context: context as never } : {}),
  };

  const [readings, total] = await Promise.all([
    prisma.bloodSugarReading.findMany({
      where,
      orderBy: { recordedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.bloodSugarReading.count({ where }),
  ]);

  return NextResponse.json({
    readings: readings.map((r) => ({
      ...r,
      status: getBloodSugarStatus(r.value, r.unit, r.context),
    })),
    total,
  });
}

const postSchema = z.object({
  value: z.number().positive("Value must be positive"),
  unit: z.enum(["MMOL", "MGDL"]).default("MGDL"),
  context: z
    .enum(["FASTING", "POST_MEAL", "BEFORE_MEAL", "RANDOM", "BEDTIME"])
    .default("FASTING"),
  notes: z.string().optional(),
  recordedAt: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const patient = await prisma.patient.findUnique({
    where: { profileId: user.profile.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
  }

  const { recordedAt, ...data } = parsed.data;

  const reading = await prisma.bloodSugarReading.create({
    data: {
      ...data,
      patientId: patient.id,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    },
  });

  const status = getBloodSugarStatus(reading.value, reading.unit, reading.context);

  return NextResponse.json({ reading: { ...reading, status } }, { status: 201 });
}
