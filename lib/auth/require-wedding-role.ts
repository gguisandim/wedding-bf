import { redirect } from "next/navigation";

import type { Database } from "@/lib/supabase/database.types";

import {
  requireCurrentWedding,
  type CurrentWedding,
} from "./get-current-wedding";

type WeddingRole =
  Database["public"]["Enums"]["wedding_member_role"];

type WeddingMemberType =
  Database["public"]["Enums"]["wedding_member_type"];

export async function requireWeddingRole(
  allowedRoles: WeddingRole[],
): Promise<CurrentWedding> {
  const wedding = await requireCurrentWedding();

  if (!allowedRoles.includes(wedding.role)) {
    redirect("/sem-acesso");
  }

  return wedding;
}

export async function requireWeddingMemberType(
  allowedTypes: WeddingMemberType[],
): Promise<CurrentWedding> {
  const wedding = await requireCurrentWedding();

  if (!allowedTypes.includes(wedding.memberType)) {
    redirect("/sem-acesso");
  }

  return wedding;
}