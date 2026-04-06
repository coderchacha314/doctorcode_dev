import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ recordId: z.string().min(1) });

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireRole("PATIENT");
  if (error) return error;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "recordId required" }, { status: 400 });

  const patient = await prisma.patient.findUnique({ where: { profileId: user.profile.id } });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const record = await prisma.medicalRecord.findFirst({
    where: { id: parsed.data.recordId, patientId: patient.id },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Extract storage path from fileUrl
  const url = new URL(record.fileUrl);
  const pathParts = url.pathname.split("/object/");
  if (pathParts.length < 2) {
    // Non-storage URL — return as-is
    return NextResponse.json({ signedUrl: record.fileUrl });
  }

  const [bucket, ...rest] = pathParts[1].split("/");
  const filePath = rest.join("/");

  const supabase = await createSupabaseServerClient();
  const { data, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 300); // 5 min expiry

  if (signError || !data) {
    return NextResponse.json({ error: "Could not generate signed URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
