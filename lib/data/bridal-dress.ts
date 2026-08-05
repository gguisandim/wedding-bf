import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type BridalDressOptionRow =
  Database["public"]["Tables"]["bridal_dress_options"]["Row"];

type BridalDressAppointmentRow =
  Database["public"]["Tables"]["bridal_dress_appointments"]["Row"];

export type BridalDressData = {
  options: BridalDressOptionRow[];
  appointments:
    BridalDressAppointmentRow[];
};

export async function getBridalDressData(
  weddingId: string,
): Promise<BridalDressData> {
  const supabase =
    await createClient();

  const optionsResult =
    await supabase
      .from("bridal_dress_options")
      .select()
      .eq("wedding_id", weddingId)
      .order("is_favorite", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

  if (optionsResult.error) {
    throw new Error(
      "Não foi possível carregar os vestidos.",
    );
  }

  const appointmentsResult =
    await supabase
      .from(
        "bridal_dress_appointments",
      )
      .select()
      .eq("wedding_id", weddingId)
      .order("appointment_at", {
        ascending: true,
      });

  if (appointmentsResult.error) {
    throw new Error(
      "Não foi possível carregar os compromissos.",
    );
  }

  return {
    options:
      optionsResult.data ?? [],
    appointments:
      appointmentsResult.data ?? [],
  };
}
