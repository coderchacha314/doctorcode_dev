import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Profile } from "@prisma/client";

export interface AuthUser {
  supabaseId: string;
  email: string;
  profile: Profile;
}

/**
 * Call at the top of any API route handler.
 * Returns { user } on success, or a NextResponse 401 on failure.
 */
export async function requireAuth(): Promise<
  { user: AuthUser; error: null } | { user: null; error: NextResponse }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const profile = await prisma.profile.findUnique({
    where: { supabaseId: user.id },
  });

  if (!profile) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Profile not found. Please complete registration." },
        { status: 401 }
      ),
    };
  }

  return {
    user: { supabaseId: user.id, email: user.email ?? "", profile },
    error: null,
  };
}

/**
 * Require a specific role.
 */
export async function requireRole(
  role: "PATIENT" | "DOCTOR"
): Promise<{ user: AuthUser; error: null } | { user: null; error: NextResponse }> {
  const result = await requireAuth();
  if (result.error) return result;

  if (result.user.profile.role !== role) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}
