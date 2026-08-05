"use server";

import { revalidatePath } from "next/cache";

import { requireWeddingRole } from "@/lib/auth/require-wedding-role";
import { createClient } from "@/lib/supabase/server";
import {
  type CreateBudgetItemInput,
  type CreateInstallmentInput,
  type RegisterPaymentInput,
  type UpdateBudgetItemInput,
  type UpdateInstallmentInput,
  createBudgetItemSchema,
  createInstallmentSchema,
  registerPaymentSchema,
  updateBudgetItemSchema,
  updateInstallmentSchema,
} from "@/lib/validations/budget";

export type BudgetActionResult =
  | {
      success: true;
      message: string;
      id?: string;
    }
  | {
      success: false;
      message: string;
    };

function revalidateBudgetPages() {
  revalidatePath("/painel");
  revalidatePath("/painel/financeiro");
  revalidatePath("/painel/fornecedores");
}

function databaseMessage(
  code: string | undefined,
  fallback: string,
) {
  if (code === "23505") {
    return "Já existe um registro com esses dados.";
  }

  if (code === "23503") {
    return "O serviço, empresa ou pagamento selecionado não existe.";
  }

  if (code === "23514") {
    return "Um dos valores informados é inválido.";
  }

  return fallback;
}

function sumScheduledAmount(
  installments: Array<{
    amount: number;
    status: string;
  }>,
) {
  return installments
    .filter(
      (installment) =>
        installment.status !==
        "cancelled",
    )
    .reduce(
      (total, installment) =>
        total + installment.amount,
      0,
    );
}

function sumPaidAmount(
  installments: Array<{
    paid_amount: number;
    status: string;
  }>,
) {
  return installments
    .filter(
      (installment) =>
        installment.status !==
        "cancelled",
    )
    .reduce(
      (total, installment) =>
        total +
        installment.paid_amount,
      0,
    );
}

async function resolveSupplierId(
  weddingId: string,
  supplierId: string | undefined,
  supplierName: string,
): Promise<
  | {
      success: true;
      supplierId: string | null;
    }
  | {
      success: false;
      message: string;
    }
> {
  const supabase = await createClient();

  if (supplierId) {
    const { data, error } =
      await supabase
        .from("suppliers")
        .select()
        .eq("id", supplierId)
        .eq("wedding_id", weddingId)
        .maybeSingle();

    if (error) {
      console.error(
        "Erro ao consultar empresa:",
        error,
      );

      return {
        success: false,
        message:
          "Não foi possível consultar a empresa.",
      };
    }

    if (!data) {
      return {
        success: false,
        message:
          "Empresa não encontrada.",
      };
    }

    return {
      success: true,
      supplierId: data.id,
    };
  }

  const normalizedName =
    supplierName.trim();

  if (!normalizedName) {
    return {
      success: true,
      supplierId: null,
    };
  }

  const {
    data: existingSupplier,
    error: existingError,
  } = await supabase
    .from("suppliers")
    .select()
    .eq("wedding_id", weddingId)
    .ilike("name", normalizedName)
    .maybeSingle();

  if (existingError) {
    console.error(
      "Erro ao procurar empresa:",
      existingError,
    );

    return {
      success: false,
      message:
        "Não foi possível consultar a empresa.",
    };
  }

  if (existingSupplier) {
    return {
      success: true,
      supplierId:
        existingSupplier.id,
    };
  }

  const {
    data: createdSupplier,
    error,
  } = await supabase
    .from("suppliers")
    .insert({
      wedding_id: weddingId,
      name: normalizedName,
      status: "active",
      updated_at:
        new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Erro ao criar empresa:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível cadastrar a empresa.",
      ),
    };
  }

  return {
    success: true,
    supplierId:
      createdSupplier.id,
  };
}

export async function createBudgetItemAction(
  input: CreateBudgetItemInput,
): Promise<BudgetActionResult> {
  const validation =
    createBudgetItemSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados do serviço.",
    };
  }

  if (
    validation.data.contractedAmount <=
    0
  ) {
    return {
      success: false,
      message:
        "Informe o valor total do serviço.",
    };
  }

  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supplierResult =
    await resolveSupplierId(
      wedding.id,
      validation.data.supplierId ||
        undefined,
      validation.data.supplierName,
    );

  if (!supplierResult.success) {
    return supplierResult;
  }

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("budget_items")
      .insert({
        wedding_id: wedding.id,
        supplier_id:
          supplierResult.supplierId,
        name: validation.data.name,
        category:
          validation.data.category,
        planned_amount:
          validation.data.contractedAmount,
        contracted_amount:
          validation.data.contractedAmount,
        status: "contracted",
        notes:
          validation.data.notes ||
          null,
        updated_at:
          new Date().toISOString(),
      })
      .select()
      .single();

  if (error) {
    console.error(
      "Erro ao criar serviço:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível criar o serviço.",
      ),
    };
  }

  revalidateBudgetPages();

  return {
    success: true,
    message:
      "Serviço adicionado.",
    id: data.id,
  };
}

export async function updateBudgetItemAction(
  input: UpdateBudgetItemInput,
): Promise<BudgetActionResult> {
  const validation =
    updateBudgetItemSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados do serviço.",
    };
  }

  const newTotal =
    validation.data
      .contractedAmount;

  if (newTotal <= 0) {
    return {
      success: false,
      message:
        "Informe o valor total do serviço.",
    };
  }

  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supplierResult =
    await resolveSupplierId(
      wedding.id,
      validation.data.supplierId ||
        undefined,
      validation.data.supplierName,
    );

  if (!supplierResult.success) {
    return supplierResult;
  }

  const supabase =
    await createClient();

  const {
    data: installments,
    error: installmentsError,
  } = await supabase
    .from("budget_installments")
    .select(
      "amount, paid_amount, status",
    )
    .eq("wedding_id", wedding.id)
    .eq(
      "budget_item_id",
      validation.data.id,
    );

  if (installmentsError) {
    console.error(
      "Erro ao validar contas do serviço:",
      installmentsError,
    );

    return {
      success: false,
      message:
        "Não foi possível validar as contas deste serviço.",
    };
  }

  const scheduled =
    sumScheduledAmount(
      installments ?? [],
    );

  const paid =
    sumPaidAmount(
      installments ?? [],
    );

  if (newTotal < paid) {
    return {
      success: false,
      message:
        "O valor total não pode ser menor que o valor já pago.",
    };
  }

  if (newTotal < scheduled) {
    return {
      success: false,
      message:
        "O valor total não pode ser menor que a soma das contas já cadastradas.",
    };
  }

  const { data, error } =
    await supabase
      .from("budget_items")
      .update({
        supplier_id:
          supplierResult.supplierId,
        name: validation.data.name,
        category:
          validation.data.category,
        planned_amount:
          newTotal,
        contracted_amount:
          newTotal,
        status: "contracted",
        notes:
          validation.data.notes ||
          null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", validation.data.id)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error) {
    console.error(
      "Erro ao atualizar serviço:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível atualizar o serviço.",
      ),
    };
  }

  if (!data) {
    return {
      success: false,
      message:
        "Serviço não encontrado.",
    };
  }

  revalidateBudgetPages();

  return {
    success: true,
    message:
      "Serviço atualizado.",
    id: data.id,
  };
}

export async function deleteBudgetItemAction(
  itemId: string,
): Promise<BudgetActionResult> {
  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("budget_items")
      .delete()
      .eq("id", itemId)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error) {
    console.error(
      "Erro ao excluir serviço:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível excluir o serviço.",
    };
  }

  if (!data) {
    return {
      success: false,
      message:
        "Serviço não encontrado.",
    };
  }

  revalidateBudgetPages();

  return {
    success: true,
    message:
      "Serviço e suas contas foram excluídos.",
  };
}

export async function createInstallmentAction(
  input: CreateInstallmentInput,
): Promise<BudgetActionResult> {
  const validation =
    createInstallmentSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados da conta.",
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
    data: item,
    error: itemError,
  } = await supabase
    .from("budget_items")
    .select()
    .eq(
      "id",
      validation.data.budgetItemId,
    )
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (itemError || !item) {
    return {
      success: false,
      message:
        "O serviço selecionado não existe.",
    };
  }

  const {
    data: existingInstallments,
    error: installmentsError,
  } = await supabase
    .from("budget_installments")
    .select("id, amount, status")
    .eq("wedding_id", wedding.id)
    .eq(
      "budget_item_id",
      item.id,
    );

  if (installmentsError) {
    return {
      success: false,
      message:
        "Não foi possível consultar as contas deste serviço.",
    };
  }

  const scheduled =
    sumScheduledAmount(
      existingInstallments ?? [],
    );

  const newScheduled =
    scheduled +
    validation.data.amount;

  if (
    item.contracted_amount > 0 &&
    newScheduled >
      item.contracted_amount
  ) {
    return {
      success: false,
      message:
        "A soma das contas ultrapassa o valor total do serviço. Ajuste o valor total antes de adicionar esta conta.",
    };
  }

  const { data, error } =
    await supabase
      .from("budget_installments")
      .insert({
        wedding_id: wedding.id,
        budget_item_id: item.id,
        description:
          validation.data.description,
        installment_number:
          (existingInstallments
            ?.length ?? 0) + 1,
        amount:
          validation.data.amount,
        due_date:
          validation.data.dueDate,
        paid_amount: 0,
        status: "pending",
        notes:
          validation.data.notes ||
          null,
        updated_at:
          new Date().toISOString(),
      })
      .select()
      .single();

  if (error) {
    console.error(
      "Erro ao criar conta:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível criar a conta.",
      ),
    };
  }

  revalidateBudgetPages();

  return {
    success: true,
    message:
      "Conta adicionada.",
    id: data.id,
  };
}

export async function updateInstallmentAction(
  input: UpdateInstallmentInput,
): Promise<BudgetActionResult> {
  const validation =
    updateInstallmentSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados da conta.",
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
    data: current,
    error: currentError,
  } = await supabase
    .from("budget_installments")
    .select()
    .eq("id", validation.data.id)
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (currentError || !current) {
    return {
      success: false,
      message:
        "Conta não encontrada.",
    };
  }

  if (
    current.paid_amount >
    validation.data.amount
  ) {
    return {
      success: false,
      message:
        "O novo valor não pode ser menor que o valor já pago.",
    };
  }

  const {
    data: targetItem,
    error: itemError,
  } = await supabase
    .from("budget_items")
    .select()
    .eq(
      "id",
      validation.data.budgetItemId,
    )
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (itemError || !targetItem) {
    return {
      success: false,
      message:
        "Serviço não encontrado.",
    };
  }

  const {
    data: otherInstallments,
    error: installmentsError,
  } = await supabase
    .from("budget_installments")
    .select("amount, status")
    .eq("wedding_id", wedding.id)
    .eq(
      "budget_item_id",
      targetItem.id,
    )
    .neq("id", current.id);

  if (installmentsError) {
    return {
      success: false,
      message:
        "Não foi possível validar as contas deste serviço.",
    };
  }

  const newScheduled =
    sumScheduledAmount(
      otherInstallments ?? [],
    ) +
    validation.data.amount;

  if (
    targetItem.contracted_amount >
      0 &&
    newScheduled >
      targetItem.contracted_amount
  ) {
    return {
      success: false,
      message:
        "A soma das contas ultrapassa o valor total do serviço.",
    };
  }

  const nextStatus =
    current.paid_amount === 0
      ? "pending"
      : current.paid_amount >=
          validation.data.amount
        ? "paid"
        : "partially_paid";

  const { data, error } =
    await supabase
      .from("budget_installments")
      .update({
        budget_item_id:
          validation.data.budgetItemId,
        description:
          validation.data.description,
        amount:
          validation.data.amount,
        due_date:
          validation.data.dueDate,
        notes:
          validation.data.notes ||
          null,
        status: nextStatus,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", validation.data.id)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error) {
    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível atualizar a conta.",
      ),
    };
  }

  if (!data) {
    return {
      success: false,
      message:
        "Conta não encontrada.",
    };
  }

  revalidateBudgetPages();

  return {
    success: true,
    message:
      "Conta atualizada.",
    id: data.id,
  };
}

export async function deleteInstallmentAction(
  installmentId: string,
): Promise<BudgetActionResult> {
  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("budget_installments")
      .delete()
      .eq("id", installmentId)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error) {
    return {
      success: false,
      message:
        "Não foi possível excluir a conta.",
    };
  }

  if (!data) {
    return {
      success: false,
      message:
        "Conta não encontrada.",
    };
  }

  revalidateBudgetPages();

  return {
    success: true,
    message: "Conta excluída.",
  };
}

export async function registerPaymentAction(
  input: RegisterPaymentInput,
): Promise<BudgetActionResult> {
  const validation =
    registerPaymentSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados do pagamento.",
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
    data: installment,
    error: readError,
  } = await supabase
    .from("budget_installments")
    .select()
    .eq(
      "id",
      validation.data.installmentId,
    )
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (readError || !installment) {
    return {
      success: false,
      message:
        "Conta não encontrada.",
    };
  }

  if (
    installment.status ===
    "cancelled"
  ) {
    return {
      success: false,
      message:
        "Uma conta cancelada não pode receber pagamento.",
    };
  }

  const newPaidAmount =
    installment.paid_amount +
    validation.data.paidAmount;

  if (
    newPaidAmount >
    installment.amount
  ) {
    const remaining =
      Math.max(
        0,
        installment.amount -
          installment.paid_amount,
      );

    return {
      success: false,
      message:
        `O valor informado ultrapassa o saldo da conta. Falta pagar ${remaining.toLocaleString(
          "pt-BR",
          {
            style: "currency",
            currency: "BRL",
          },
        )}.`,
    };
  }

  const status =
    newPaidAmount >=
    installment.amount
      ? "paid"
      : "partially_paid";

  const paymentNote =
    validation.data.notes.trim();

  const nextNotes =
    paymentNote
      ? [
          installment.notes,
          `Pagamento: ${paymentNote}`,
        ]
          .filter(Boolean)
          .join("\n")
      : installment.notes;

  const { data, error } =
    await supabase
      .from("budget_installments")
      .update({
        paid_amount:
          newPaidAmount,
        paid_at:
          validation.data.paidAt,
        payment_method:
          validation.data.paymentMethod ||
          null,
        status,
        notes: nextNotes,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", installment.id)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message:
        "Não foi possível registrar o pagamento.",
    };
  }

  revalidateBudgetPages();

  return {
    success: true,
    message:
      status === "paid"
        ? "Conta totalmente paga."
        : "Pagamento parcial adicionado.",
  };
}

export async function resetInstallmentPaymentAction(
  installmentId: string,
): Promise<BudgetActionResult> {
  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("budget_installments")
      .update({
        paid_amount: 0,
        paid_at: null,
        payment_method: null,
        status: "pending",
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", installmentId)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message:
        "Não foi possível zerar os pagamentos.",
    };
  }

  revalidateBudgetPages();

  return {
    success: true,
    message:
      "Pagamentos removidos e conta reaberta.",
  };
}
