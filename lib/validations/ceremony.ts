import { z } from "zod";

export const ceremonyBlockTypeSchema = z.enum([
  "reception",
  "entrance",
  "music",
  "speech",
  "ritual",
  "vows",
  "signing",
  "exit",
  "other",
]);

export const ceremonyBlockStatusSchema = z.enum([
  "planned",
  "confirmed",
  "attention",
]);

export const ceremonyChecklistPrioritySchema = z.enum([
  "normal",
  "medium",
  "high",
]);

export const ceremonyResponsibleTypeSchema = z.enum([
  "bride",
  "groom",
  "couple",
  "planner",
  "other",
]);

const blockFields = {
  startTime: z.string().regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Informe um horário válido.",
  ),
  durationMinutes: z
    .number()
    .int()
    .min(1, "A duração mínima é de 1 minuto.")
    .max(240, "A duração máxima é de 240 minutos."),
  title: z
    .string()
    .trim()
    .min(2, "Informe o nome do momento.")
    .max(140),
  description: z.string().trim().max(1500).optional().default(""),
  responsible: z.string().trim().max(160).optional().default(""),
  participants: z.string().trim().max(500).optional().default(""),
  instructions: z.string().trim().max(1800).optional().default(""),
  type: ceremonyBlockTypeSchema,
  status: ceremonyBlockStatusSchema,
};

export const createCeremonyBlockSchema = z.object(blockFields);
export const updateCeremonyBlockSchema = z.object({
  ...blockFields,
  id: z.string().uuid(),
});

export const reorderCeremonyBlocksSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

const checklistFields = {
  blockId: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(2, "Informe o nome da tarefa.")
    .max(180),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
    .optional()
    .or(z.literal(""))
    .default(""),
  priority: ceremonyChecklistPrioritySchema,
  responsibleType: ceremonyResponsibleTypeSchema,
  responsibleName: z.string().trim().max(120).optional().default(""),
};

export const createCeremonyChecklistItemSchema = z
  .object(checklistFields)
  .superRefine((value, context) => {
    if (value.responsibleType === "other" && !value.responsibleName) {
      context.addIssue({
        code: "custom",
        path: ["responsibleName"],
        message: "Informe o nome do responsável.",
      });
    }
  });

export const updateCeremonyChecklistItemSchema = z
  .object({ ...checklistFields, id: z.string().uuid() })
  .superRefine((value, context) => {
    if (value.responsibleType === "other" && !value.responsibleName) {
      context.addIssue({
        code: "custom",
        path: ["responsibleName"],
        message: "Informe o nome do responsável.",
      });
    }
  });

export type CreateCeremonyBlockInput = z.infer<
  typeof createCeremonyBlockSchema
>;
export type UpdateCeremonyBlockInput = z.infer<
  typeof updateCeremonyBlockSchema
>;
export type ReorderCeremonyBlocksInput = z.infer<
  typeof reorderCeremonyBlocksSchema
>;
export type CreateCeremonyChecklistItemInput = z.infer<
  typeof createCeremonyChecklistItemSchema
>;
export type UpdateCeremonyChecklistItemInput = z.infer<
  typeof updateCeremonyChecklistItemSchema
>;
