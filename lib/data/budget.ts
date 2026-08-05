import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type SupplierRow =
  Database["public"]["Tables"]["suppliers"]["Row"];

type BudgetItemRow =
  Database["public"]["Tables"]["budget_items"]["Row"];

type BudgetInstallmentRow =
  Database["public"]["Tables"]["budget_installments"]["Row"];

export type BudgetManagementData = {
  suppliers: SupplierRow[];
  items: BudgetItemRow[];
  installments: BudgetInstallmentRow[];
};

export async function getBudgetManagementData(
  weddingId: string,
): Promise<BudgetManagementData> {
  const supabase =
    await createClient();

  const suppliersResult =
    await supabase
      .from("suppliers")
      .select()
      .eq("wedding_id", weddingId)
      .order("name", {
        ascending: true,
      });

  if (suppliersResult.error) {
    throw new Error(
      "Não foi possível carregar os fornecedores.",
    );
  }

  const itemsResult =
    await supabase
      .from("budget_items")
      .select()
      .eq("wedding_id", weddingId)
      .order("category", {
        ascending: true,
      })
      .order("name", {
        ascending: true,
      });

  if (itemsResult.error) {
    throw new Error(
      "Não foi possível carregar o orçamento.",
    );
  }

  const installmentsResult =
    await supabase
      .from("budget_installments")
      .select()
      .eq("wedding_id", weddingId)
      .order("due_date", {
        ascending: true,
      });

  if (installmentsResult.error) {
    throw new Error(
      "Não foi possível carregar as contas a pagar.",
    );
  }

  return {
    suppliers:
      suppliersResult.data ?? [],
    items: itemsResult.data ?? [],
    installments:
      installmentsResult.data ?? [],
  };
}
