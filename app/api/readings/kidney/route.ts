import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getKidneyStatus } from "@/lib/status";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const patient = await prisma.patient.findUnique({ where: { profileId: user.profile.id } });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    patientId: patient.id,
    ...(from || to ? { recordedAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
  };

  const [readings, total] = await Promise.all([
    prisma.kidneyReading.findMany({ where, orderBy: { recordedAt: "desc" }, take: limit }),
    prisma.kidneyReading.count({ where }),
  ]);

  return NextResponse.json({
    readings: readings.map((r) => ({ ...r, status: getKidneyStatus(r.creatinine) })),
    total,
  });
}

const postSchema = z.object({
  creatinine: z.number().positive().optional(),
  bun: z.number().positive().optional(),
  egfr: z.number().positive().optional(),
  uricAcid: z.number().positive().optional(),
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
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const patient = await prisma.patient.findUnique({ where: { profileId: user.profile.id } });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const { recordedAt, ...data } = parsed.data;
  const reading = await prisma.kidneyReading.create({
    data: { ...data, patientId: patient.id, recordedAt: recordedAt ? new Date(recordedAt) : new Date() },
  });

  return NextResponse.json({ reading: { ...reading, status: getKidneyStatus(reading.creatinine) } }, { status: 201 });
}
