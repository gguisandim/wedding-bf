import { z } from "zod";

export const checklistToneSchema = z.enum([
  "blue",
  "green",
  "yellow",
  "terracotta",
]);

export const checklistTaskStatusSchema = z.enum([
  "pending",
  "progress",
  "completed",
]);

export const checklistTaskPrioritySchema = z.enum([
  "normal",
  "medium",
  "high",
]);

export const checklistResponsibleTypeSchema = z.enum([
  "bride",
  "groom",
  "couple",
  "planner",
  "other",
]);

export const createChecklistGroupSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe o nome da etapa.")
    .max(100),

  description: z
    .string()
    .trim()
    .max(280)
    .optional()
    .default(""),

  tone: checklistToneSchema,
});

export const updateChecklistGroupSchema =
  createChecklistGroupSchema.extend({
    id: z.string().uuid(),
  });

const dueDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Informe uma data válida.",
  )
  .optional()
  .or(z.literal(""));

export const createChecklistTaskSchema = z.object({
  groupId: z.string().uuid(),

  title: z
    .string()
    .trim()
    .min(2, "Informe o título da tarefa.")
    .max(160),

  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .default(""),

  dueDate: dueDateSchema,

  responsibleType: checklistResponsibleTypeSchema,

  responsibleName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default(""),

  status: checklistTaskStatusSchema,
  priority: checklistTaskPrioritySchema,
});

export const updateChecklistTaskSchema =
  createChecklistTaskSchema.extend({
    id: z.string().uuid(),
  });

export type CreateChecklistGroupInput = z.infer<
  typeof createChecklistGroupSchema
>;

export type UpdateChecklistGroupInput = z.infer<
  typeof updateChecklistGroupSchema
>;

export type CreateChecklistTaskInput = z.infer<
  typeof createChecklistTaskSchema
>;

export type UpdateChecklistTaskInput = z.infer<
  typeof updateChecklistTaskSchema
>;
