import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type BudgetItemRow =
  Database["public"]["Tables"]["budget_items"]["Row"];

type BudgetInstallmentRow =
  Database["public"]["Tables"]["budget_installments"]["Row"];

type SupplierRow =
  Database["public"]["Tables"]["suppliers"]["Row"];

export type UpcomingPayable = {
  id: string;
  serviceName: string;
  supplierName?: string;
  description: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  isOverdue: boolean;
};

export async function getUpcomingPayables(
  weddingId: string,
  limit = 5,
): Promise<UpcomingPayable[]> {
  const supabase = await createClient();

  const installmentsResult =
    await supabase
      .from("budget_installments")
      .select()
      .eq("wedding_id", weddingId)
      .in("status", [
        "pending",
        "partially_paid",
      ])
      .order("due_date", {
        ascending: true,
      });

  if (installmentsResult.error) {
    console.error(
      "Erro ao carregar próximas contas:",
      installmentsResult.error,
    );

    throw new Error(
      "Não foi possível carregar as próximas contas.",
    );
  }

  const installments:
    BudgetInstallmentRow[] =
    installmentsResult.data ?? [];

  const itemIds = Array.from(
    new Set(
      installments.map(
        (installment) =>
          installment.budget_item_id,
      ),
    ),
  );

  if (itemIds.length === 0) {
    return [];
  }

  const itemsResult =
    await supabase
      .from("budget_items")
      .select()
      .eq("wedding_id", weddingId)
      .in("id", itemIds);

  if (itemsResult.error) {
    console.error(
      "Erro ao carregar serviços das próximas contas:",
      itemsResult.error,
    );

    throw new Error(
      "Não foi possível carregar os serviços.",
    );
  }

  const items:
    BudgetItemRow[] =
    itemsResult.data ?? [];

  const supplierIds = Array.from(
    new Set(
      items.flatMap((item) =>
        item.supplier_id
          ? [item.supplier_id]
          : [],
      ),
    ),
  );

  let suppliers: SupplierRow[] = [];

  if (supplierIds.length > 0) {
    const suppliersResult =
      await supabase
        .from("suppliers")
        .select()
        .eq("wedding_id", weddingId)
        .in("id", supplierIds);

    if (suppliersResult.error) {
      console.error(
        "Erro ao carregar fornecedores das próximas contas:",
        suppliersResult.error,
      );
    } else {
      suppliers =
        suppliersResult.data ?? [];
    }
  }

  const itemsById = new Map(
    items.map((item) => [
      item.id,
      item,
    ]),
  );

  const suppliersById = new Map(
    suppliers.map((supplier) => [
      supplier.id,
      supplier,
    ]),
  );

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const payables =
    installments.reduce<UpcomingPayable[]>(
      (result, installment) => {
        const item = itemsById.get(
          installment.budget_item_id,
        );

        if (!item) {
          return result;
        }

        const supplier =
          item.supplier_id
            ? suppliersById.get(
                item.supplier_id,
              )
            : undefined;

        const dueDate = new Date(
          `${installment.due_date}T00:00:00`,
        );

        const payable:
          UpcomingPayable = {
          id: installment.id,
          serviceName: item.name,
          description:
            installment.description,
          amount:
            installment.amount,
          paidAmount:
            installment.paid_amount,
          remainingAmount:
            Math.max(
              0,
              installment.amount -
                installment.paid_amount,
            ),
          dueDate:
            installment.due_date,
          isOverdue:
            dueDate.getTime() <
            today.getTime(),

          ...(supplier
            ? {
                supplierName:
                  supplier.name,
              }
            : {}),
        };

        result.push(payable);

        return result;
      },
      [],
    );

  return payables.slice(0, limit);
}