import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  const patient = await prisma.patient.findUnique({
    where: { profileId: user.profile.id },
  });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const fileType = searchParams.get("fileType");

  const records = await prisma.medicalRecord.findMany({
    where: {
      patientId: patient.id,
      ...(fileType ? { fileType } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ records });
}

const postSchema = z.object({
  name: z.string().min(1),
  fileUrl: z.string().url(),
  fileType: z.enum(["pdf", "image"]),
  fileSize: z.number().int().positive(),
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
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const record = await prisma.medicalRecord.create({
    data: { ...parsed.data, patientId: patient.id },
  });

  return NextResponse.json({ record }, { status: 201 });
}
