"use server";

import { revalidatePath } from "next/cache";

import { requireWeddingRole } from "@/lib/auth/require-wedding-role";
import { createClient } from "@/lib/supabase/server";
import {
  type CreateSeatingTableInput,
  type UpdateSeatingTableInput,
  assignGuestToTableSchema,
  createSeatingTableSchema,
  unassignGuestFromTableSchema,
  updateSeatingTableSchema,
  updateTablePositionSchema,
} from "@/lib/validations/tables";

export type TableActionResult =
  | {
      success: true;
      message: string;
      id?: string;
    }
  | {
      success: false;
      message: string;
    };

function revalidateTablePages() {
  revalidatePath("/painel");
  revalidatePath("/painel/convidados");
  revalidatePath("/painel/mesas");
}

function databaseMessage(
  code: string | undefined,
  fallback: string,
) {
  if (code === "23505") {
    return "Já existe uma mesa com esse nome.";
  }

  if (code === "23514") {
    return "A capacidade ou a posição informada é inválida.";
  }

  if (code === "23503") {
    return "A mesa ou o convidado selecionado não existe.";
  }

  return fallback;
}

export async function createSeatingTableAction(
  input: CreateSeatingTableInput,
): Promise<TableActionResult> {
  const validation =
    createSeatingTableSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados da mesa.",
    };
  }

  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const {
    data: createdTable,
    error,
  } = await supabase
    .from("seating_tables")
    .insert({
      wedding_id: wedding.id,
      name: validation.data.name,
      shape: validation.data.shape,
      capacity:
        validation.data.capacity,
      position_x:
        validation.data.positionX,
      position_y:
        validation.data.positionY,
      rotation:
        validation.data.rotation,
      notes:
        validation.data.notes || null,
      updated_at:
        new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error(
      "Erro ao criar mesa:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível criar a mesa.",
      ),
    };
  }

  revalidateTablePages();

  return {
    success: true,
    message: "Mesa criada.",
    id: createdTable.id,
  };
}

export async function updateSeatingTableAction(
  input: UpdateSeatingTableInput,
): Promise<TableActionResult> {
  const validation =
    updateSeatingTableSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados da mesa.",
    };
  }

  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const {
    data: currentTable,
    error: readError,
  } = await supabase
    .from("seating_tables")
    .select("id, capacity")
    .eq("id", validation.data.id)
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (readError) {
    console.error(
      "Erro ao consultar mesa:",
      readError,
    );

    return {
      success: false,
      message:
        "Não foi possível consultar a mesa.",
    };
  }

  if (!currentTable) {
    return {
      success: false,
      message: "Mesa não encontrada.",
    };
  }

  const {
    count: assignedCount,
    error: countError,
  } = await supabase
    .from("guest_table_assignments")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("wedding_id", wedding.id)
    .eq("table_id", currentTable.id);

  if (countError) {
    console.error(
      "Erro ao contar lugares ocupados:",
      countError,
    );

    return {
      success: false,
      message:
        "Não foi possível verificar a ocupação da mesa.",
    };
  }

  if (
    (assignedCount ?? 0) >
    validation.data.capacity
  ) {
    return {
      success: false,
      message:
        "A capacidade não pode ser menor que a quantidade de convidados já atribuídos.",
    };
  }

  const {
    data: updatedTable,
    error,
  } = await supabase
    .from("seating_tables")
    .update({
      name: validation.data.name,
      shape: validation.data.shape,
      capacity:
        validation.data.capacity,
      position_x:
        validation.data.positionX,
      position_y:
        validation.data.positionY,
      rotation:
        validation.data.rotation,
      notes:
        validation.data.notes || null,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", validation.data.id)
    .eq("wedding_id", wedding.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao atualizar mesa:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível atualizar a mesa.",
      ),
    };
  }

  if (!updatedTable) {
    return {
      success: false,
      message: "Mesa não encontrada.",
    };
  }

  revalidateTablePages();

  return {
    success: true,
    message: "Mesa atualizada.",
    id: updatedTable.id,
  };
}

export async function deleteSeatingTableAction(
  tableId: string,
): Promise<TableActionResult> {
  const validation =
    updateSeatingTableSchema.shape.id.safeParse(
      tableId,
    );

  if (!validation.success) {
    return {
      success: false,
      message: "Mesa inválida.",
    };
  }

  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const {
    data: deletedTable,
    error,
  } = await supabase
    .from("seating_tables")
    .delete()
    .eq("id", validation.data)
    .eq("wedding_id", wedding.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao excluir mesa:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível excluir a mesa.",
    };
  }

  if (!deletedTable) {
    return {
      success: false,
      message: "Mesa não encontrada.",
    };
  }

  revalidateTablePages();

  return {
    success: true,
    message:
      "Mesa excluída. Os convidados ficaram sem mesa.",
  };
}

export async function assignGuestToTableAction(
  input: {
    guestId: string;
    tableId: string;
  },
): Promise<TableActionResult> {
  const validation =
    assignGuestToTableSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        "Mesa ou convidado inválido.",
    };
  }

  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const [
    tableResult,
    guestResult,
    existingAssignmentResult,
  ] = await Promise.all([
    supabase
      .from("seating_tables")
      .select("id, capacity")
      .eq(
        "id",
        validation.data.tableId,
      )
      .eq(
        "wedding_id",
        wedding.id,
      )
      .maybeSingle(),

    supabase
      .from("guests")
      .select(
        "id, confirmation_status",
      )
      .eq(
        "id",
        validation.data.guestId,
      )
      .eq(
        "wedding_id",
        wedding.id,
      )
      .maybeSingle(),

    supabase
      .from("guest_table_assignments")
      .select("id, table_id")
      .eq(
        "wedding_id",
        wedding.id,
      )
      .eq(
        "guest_id",
        validation.data.guestId,
      )
      .maybeSingle(),
  ]);

  if (
    tableResult.error ||
    guestResult.error ||
    existingAssignmentResult.error
  ) {
    console.error(
      "Erro ao validar atribuição de mesa:",
      tableResult.error ??
        guestResult.error ??
        existingAssignmentResult.error,
    );

    return {
      success: false,
      message:
        "Não foi possível validar a atribuição.",
    };
  }

  if (!tableResult.data) {
    return {
      success: false,
      message: "Mesa não encontrada.",
    };
  }

  if (!guestResult.data) {
    return {
      success: false,
      message:
        "Convidado não encontrado.",
    };
  }

  if (
    guestResult.data
      .confirmation_status ===
    "declined"
  ) {
    return {
      success: false,
      message:
        "Um convidado que recusou o convite não pode ser colocado em uma mesa.",
    };
  }

  if (
    existingAssignmentResult.data
      ?.table_id === tableResult.data.id
  ) {
    return {
      success: true,
      message:
        "O convidado já está nesta mesa.",
    };
  }

  const {
    count: occupiedSeats,
    error: countError,
  } = await supabase
    .from("guest_table_assignments")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq(
      "wedding_id",
      wedding.id,
    )
    .eq(
      "table_id",
      tableResult.data.id,
    );

  if (countError) {
    console.error(
      "Erro ao verificar capacidade:",
      countError,
    );

    return {
      success: false,
      message:
        "Não foi possível verificar a capacidade da mesa.",
    };
  }

  if (
    (occupiedSeats ?? 0) >=
    tableResult.data.capacity
  ) {
    return {
      success: false,
      message:
        "Esta mesa já atingiu a capacidade máxima.",
    };
  }

  const { error } = await supabase
    .from("guest_table_assignments")
    .upsert(
      {
        wedding_id: wedding.id,
        table_id:
          validation.data.tableId,
        guest_id:
          validation.data.guestId,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "wedding_id,guest_id",
      },
    );

  if (error) {
    console.error(
      "Erro ao atribuir convidado à mesa:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível atribuir o convidado à mesa.",
      ),
    };
  }

  revalidateTablePages();

  return {
    success: true,
    message:
      "Convidado atribuído à mesa.",
  };
}

export async function unassignGuestFromTableAction(
  input: {
    guestId: string;
  },
): Promise<TableActionResult> {
  const validation =
    unassignGuestFromTableSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message: "Convidado inválido.",
    };
  }

  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const { error } = await supabase
    .from("guest_table_assignments")
    .delete()
    .eq(
      "guest_id",
      validation.data.guestId,
    )
    .eq(
      "wedding_id",
      wedding.id,
    );

  if (error) {
    console.error(
      "Erro ao remover convidado da mesa:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível remover o convidado da mesa.",
    };
  }

  revalidateTablePages();

  return {
    success: true,
    message:
      "Convidado removido da mesa.",
  };
}

export async function updateTablePositionAction(
  input: {
    tableId: string;
    positionX: number;
    positionY: number;
  },
): Promise<TableActionResult> {
  const validation =
    updateTablePositionSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message: "Posição inválida.",
    };
  }

  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("seating_tables")
      .update({
        position_x:
          validation.data.positionX,
        position_y:
          validation.data.positionY,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        validation.data.tableId,
      )
      .eq(
        "wedding_id",
        wedding.id,
      )
      .select("id")
      .maybeSingle();

  if (error) {
    console.error(
      "Erro ao mover mesa:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível salvar a posição da mesa.",
    };
  }

  if (!data) {
    return {
      success: false,
      message: "Mesa não encontrada.",
    };
  }

  revalidateTablePages();

  return {
    success: true,
    message: "Posição da mesa salva.",
  };
}
