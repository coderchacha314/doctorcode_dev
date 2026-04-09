import { NextResponse } from "next/server";
import { DEV_TOKEN, DEV_COOKIE, DEV_DOCTOR } from "@/lib/doctor/devBypass";

export const dynamic = "force-dynamic";

/** Only active in development. Sets a cookie so all doctor API routes return mock data. */
export async function POST(): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const res = NextResponse.json({ success: true, ...DEV_DOCTOR });
  res.cookies.set(DEV_COOKIE, DEV_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return res;
}
