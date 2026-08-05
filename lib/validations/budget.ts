import { z } from "zod";

export const budgetItemStatusSchema =
  z.enum([
    "planned",
    "quoted",
    "contracted",
    "completed",
    "cancelled",
  ]);

export const installmentStatusSchema =
  z.enum([
    "pending",
    "partially_paid",
    "paid",
    "cancelled",
  ]);

export const createBudgetItemSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(2, "Informe o nome do serviço.")
      .max(120),

    category: z
      .string()
      .trim()
      .min(2, "Informe a categoria.")
      .max(80),

    plannedAmount: z
      .number()
      .min(0)
      .max(999999999),

    contractedAmount: z
      .number()
      .min(0)
      .max(999999999),

    status: budgetItemStatusSchema,

    supplierId: z
      .string()
      .uuid()
      .optional()
      .or(z.literal("")),

    supplierName: z
      .string()
      .trim()
      .max(120)
      .optional()
      .default(""),

    notes: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .default(""),
  });

export const updateBudgetItemSchema =
  createBudgetItemSchema.extend({
    id: z.string().uuid(),
  });

export const createInstallmentSchema =
  z.object({
    budgetItemId: z.string().uuid(),

    description: z
      .string()
      .trim()
      .min(2, "Informe a descrição da cobrança.")
      .max(120),

    amount: z
      .number()
      .positive()
      .max(999999999),

    dueDate: z
      .string()
      .date(),

    notes: z
      .string()
      .trim()
      .max(500)
      .optional()
      .default(""),
  });

export const updateInstallmentSchema =
  createInstallmentSchema.extend({
    id: z.string().uuid(),
  });

export const registerPaymentSchema =
  z.object({
    installmentId: z.string().uuid(),

    paidAmount: z
      .number()
      .positive()
      .max(999999999),

    paidAt: z
      .string()
      .datetime(),

    paymentMethod: z
      .string()
      .trim()
      .max(80)
      .optional()
      .default(""),

    notes: z
      .string()
      .trim()
      .max(500)
      .optional()
      .default(""),
  });

export type CreateBudgetItemInput =
  z.infer<
    typeof createBudgetItemSchema
  >;

export type UpdateBudgetItemInput =
  z.infer<
    typeof updateBudgetItemSchema
  >;

export type CreateInstallmentInput =
  z.infer<
    typeof createInstallmentSchema
  >;

export type UpdateInstallmentInput =
  z.infer<
    typeof updateInstallmentSchema
  >;

export type RegisterPaymentInput =
  z.infer<
    typeof registerPaymentSchema
  >;
