import { z } from "zod";

export const cronogramaResponsibleTypeSchema =
  z.enum([
    "bride",
    "groom",
    "couple",
    "planner",
    "other",
  ]);

export const cronogramaPrioritySchema =
  z.enum([
    "normal",
    "high",
  ]);

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Informe uma data válida.",
  );

const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Informe um horário válido.",
  )
  .optional()
  .or(z.literal(""));

const eventFields = {
  title: z
    .string()
    .trim()
    .min(
      2,
      "Informe o título do compromisso.",
    )
    .max(140),

  description: z
    .string()
    .trim()
    .max(1200)
    .optional()
    .default(""),

  eventDate: dateSchema,

  startTime: timeSchema,
  endTime: timeSchema,

  allDay: z.boolean(),

  category: z
    .string()
    .trim()
    .min(
      2,
      "Informe a categoria.",
    )
    .max(80),

  location: z
    .string()
    .trim()
    .max(180)
    .optional()
    .default(""),

  responsibleType:
    cronogramaResponsibleTypeSchema,

  responsibleName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default(""),

  priority:
    cronogramaPrioritySchema,
};

type EventValidationValue = {
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  responsibleType:
    | "bride"
    | "groom"
    | "couple"
    | "planner"
    | "other";
  responsibleName?: string;
};

function refineEvent(
  value: EventValidationValue,
  context: z.RefinementCtx,
) {
  if (!value.allDay) {
    if (
      value.endTime &&
      !value.startTime
    ) {
      context.addIssue({
        code: "custom",
        path: ["startTime"],
        message:
          "Informe o horário inicial.",
      });
    }

    if (
      value.startTime &&
      value.endTime &&
      value.endTime <=
        value.startTime
    ) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message:
          "O horário final deve ser posterior ao inicial.",
      });
    }
  }

  if (
    value.responsibleType ===
      "other" &&
    !value.responsibleName
  ) {
    context.addIssue({
      code: "custom",
      path: ["responsibleName"],
      message:
        "Informe o nome do responsável.",
    });
  }
}

export const createCronogramaEventSchema =
  z
    .object(eventFields)
    .superRefine(refineEvent);

export const updateCronogramaEventSchema =
  z
    .object({
      ...eventFields,
      id: z.string().uuid(),
    })
    .superRefine(refineEvent);

export type CreateCronogramaEventInput =
  z.infer<
    typeof createCronogramaEventSchema
  >;

export type UpdateCronogramaEventInput =
  z.infer<
    typeof updateCronogramaEventSchema
  >;
