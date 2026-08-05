import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type WeddingRole =
  Database["public"]["Enums"]["wedding_member_role"];

type WeddingMemberType =
  Database["public"]["Enums"]["wedding_member_type"];

export type CurrentWedding = {
  id: string;

  brideName: string;
  groomName: string;
  memberName: string;

  weddingDate: string;
  weddingTime: string | null;

  venueName: string | null;
  venueAddress: string | null;

  timezone: string;
  currency: string;

  role: WeddingRole;
  memberType: WeddingMemberType;
};

function getMetadataName(
  metadata: Record<string, unknown> | undefined,
): string | null {
  if (!metadata) {
    return null;
  }

  const possibleNames = [
    metadata.full_name,
    metadata.display_name,
    metadata.preferred_name,
    metadata.name,
  ];

  for (const possibleName of possibleNames) {
    if (
      typeof possibleName === "string" &&
      possibleName.trim().length > 0
    ) {
      return possibleName.trim();
    }
  }

  return null;
}

function formatEmailName(
  email: string | undefined,
): string | null {
  const emailPrefix = email
    ?.split("@")[0]
    ?.trim();

  if (!emailPrefix) {
    return null;
  }

  const normalized = emailPrefix
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return null;
  }

  return normalized
    .split(" ")
    .map((part) =>
      part
        ? `${part.charAt(0).toUpperCase()}${part.slice(1)}`
        : "",
    )
    .join(" ");
}

function resolveMemberName({
  memberType,
  brideName,
  groomName,
  metadataName,
  emailName,
}: {
  memberType: WeddingMemberType;
  brideName: string;
  groomName: string;
  metadataName: string | null;
  emailName: string | null;
}): string {
  if (memberType === "bride") {
    return brideName;
  }

  if (memberType === "groom") {
    return groomName;
  }

  if (metadataName) {
    return metadataName;
  }

  if (emailName) {
    return emailName;
  }

  const fallbackLabels: Record<
    WeddingMemberType,
    string
  > = {
    bride: brideName,
    groom: groomName,
    planner: "Cerimonialista",
    developer: "Desenvolvedor",
    other: "Usuário",
  };

  return fallbackLabels[memberType];
}

export const getCurrentWedding = cache(
  async (): Promise<CurrentWedding | null> => {
    const supabase = await createClient();

    const {
      data: claimsData,
      error: claimsError,
    } = await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return null;
    }

    const { data, error } = await supabase
      .from("wedding_members")
      .select(`
        role,
        member_type,
        wedding:weddings (
          id,
          bride_name,
          groom_name,
          wedding_date,
          wedding_time,
          venue_name,
          venue_address,
          timezone,
          currency
        )
      `)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Não foi possível carregar o casamento: ${error.message}`,
      );
    }

    if (!data || !data.wedding) {
      return null;
    }

    const wedding = Array.isArray(data.wedding)
      ? data.wedding[0]
      : data.wedding;

    if (!wedding) {
      return null;
    }

    const { data: userData } =
      await supabase.auth.getUser();

    const metadataName = getMetadataName(
      userData.user?.user_metadata,
    );

    const emailName = formatEmailName(
      userData.user?.email,
    );

    const memberName = resolveMemberName({
      memberType: data.member_type,
      brideName: wedding.bride_name,
      groomName: wedding.groom_name,
      metadataName,
      emailName,
    });

    return {
      id: wedding.id,

      brideName: wedding.bride_name,
      groomName: wedding.groom_name,
      memberName,

      weddingDate: wedding.wedding_date,
      weddingTime: wedding.wedding_time,

      venueName: wedding.venue_name,
      venueAddress: wedding.venue_address,

      timezone: wedding.timezone,
      currency: wedding.currency,

      role: data.role,
      memberType: data.member_type,
    };
  },
);

export async function requireCurrentWedding(): Promise<CurrentWedding> {
  const wedding = await getCurrentWedding();

  if (!wedding) {
    redirect("/sem-acesso");
  }

  return wedding;
}
