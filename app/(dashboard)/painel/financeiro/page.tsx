import BudgetManager, {
  type BudgetItem,
  type BudgetSupplier,
} from "@/components/dashboard/financeiro/budget-manager";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";
import { getBudgetManagementData } from "@/lib/data/budget";

export default async function FinancePage() {
  const wedding =
    await requireCurrentWedding();

  const {
    suppliers,
    items,
    installments,
  } =
    await getBudgetManagementData(
      wedding.id,
    );

  const installmentsByItem =
    new Map<
      string,
      typeof installments
    >();

  for (const installment of installments) {
    const current =
      installmentsByItem.get(
        installment.budget_item_id,
      ) ?? [];

    current.push(installment);

    installmentsByItem.set(
      installment.budget_item_id,
      current,
    );
  }

  const supplierNameById =
    new Map(
      suppliers.map((supplier) => [
        supplier.id,
        supplier.name,
      ]),
    );

  const budgetItems:
    BudgetItem[] =
    items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,

      plannedAmount:
        item.planned_amount,

      contractedAmount:
        item.contracted_amount,

      status:
        item.status as
          BudgetItem["status"],

      supplierId:
        item.supplier_id ??
        undefined,

      supplierName:
        item.supplier_id
          ? supplierNameById.get(
              item.supplier_id,
            )
          : undefined,

      notes:
        item.notes ??
        undefined,

      installments:
        (
          installmentsByItem.get(
            item.id,
          ) ?? []
        ).map(
          (installment) => ({
            id: installment.id,

            description:
              installment.description,

            installmentNumber:
              installment.installment_number,

            amount:
              installment.amount,

            dueDate:
              installment.due_date,

            paidAmount:
              installment.paid_amount,

            paidAt:
              installment.paid_at ??
              undefined,

            paymentMethod:
              installment.payment_method ??
              undefined,

            status:
              installment.status as
                BudgetItem["installments"][number]["status"],

            notes:
              installment.notes ??
              undefined,
          }),
        ),
    }));

  const budgetSuppliers:
    BudgetSupplier[] =
    suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
    }));

  return (
    <BudgetManager
      initialItems={budgetItems}
      initialSuppliers={
        budgetSuppliers
      }
    />
  );
}
