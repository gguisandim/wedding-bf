import { redirect } from "next/navigation";

import BridalDressManager, {
  type BridalDressAppointment,
  type BridalDressOption,
} from "@/components/dashboard/vestido/bridal-dress-manager";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";
import { getBridalDressData } from "@/lib/data/bridal-dress";

function canAccessPrivateBrideArea(
  memberType: string,
): boolean {
  return (
    memberType === "bride" ||
    memberType === "developer"
  );
}

export default async function SuppliersPage() {
  const wedding =
    await requireCurrentWedding();

  if (
    !canAccessPrivateBrideArea(
      wedding.memberType,
    )
  ) {
    redirect("/painel");
  }

  const {
    options,
    appointments,
  } = await getBridalDressData(
    wedding.id,
  );

  const dressOptions:
    BridalDressOption[] =
    options.map((option) => ({
      id: option.id,
      title: option.title,

      atelierName:
        option.atelier_name ??
        undefined,

      status:
        option.status as
          BridalDressOption["status"],

      estimatedAmount:
        option.estimated_amount,

      finalAmount:
        option.final_amount ??
        undefined,

      imageUrl:
        option.image_url ??
        undefined,

      isFavorite:
        option.is_favorite,

      notes:
        option.notes ??
        undefined,
    }));

  const dressAppointments:
    BridalDressAppointment[] =
    appointments.map(
      (appointment) => ({
        id: appointment.id,

        dressOptionId:
          appointment.dress_option_id ??
          undefined,

        title:
          appointment.title,

        appointmentAt:
          appointment.appointment_at,

        location:
          appointment.location ??
          undefined,

        completed:
          appointment.completed,

        notes:
          appointment.notes ??
          undefined,
      }),
    );

  return (
    <BridalDressManager
      initialOptions={dressOptions}
      initialAppointments={
        dressAppointments
      }
      brideName={wedding.brideName}
    />
  );
}
