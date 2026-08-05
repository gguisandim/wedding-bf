import { z } from "zod";

export const bridalDressStatusSchema =
  z.enum([
    "inspiration",
    "shortlisted",
    "fitting",
    "chosen",
    "discarded",
  ]);

export const createBridalDressOptionSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        2,
        "Informe um nome para o vestido.",
      )
      .max(120),

    atelierName: z
      .string()
      .trim()
      .max(120)
      .optional()
      .default(""),

    status:
      bridalDressStatusSchema,

    estimatedAmount: z
      .number()
      .min(0)
      .max(999999999),

    finalAmount: z
      .number()
      .min(0)
      .max(999999999)
      .nullable(),

    imageUrl: z
      .string()
      .trim()
      .url(
        "Informe uma URL de imagem válida.",
      )
      .optional()
      .or(z.literal(""))
      .default(""),

    isFavorite: z.boolean(),

    notes: z
      .string()
      .trim()
      .max(1500)
      .optional()
      .default(""),
  });

export const updateBridalDressOptionSchema =
  createBridalDressOptionSchema.extend({
    id: z.string().uuid(),
  });

export const createBridalDressAppointmentSchema =
  z.object({
    dressOptionId: z
      .string()
      .uuid()
      .optional()
      .or(z.literal("")),

    title: z
      .string()
      .trim()
      .min(
        2,
        "Informe o nome do compromisso.",
      )
      .max(120),

    appointmentAt: z
      .string()
      .datetime(),

    location: z
      .string()
      .trim()
      .max(180)
      .optional()
      .default(""),

    completed: z.boolean(),

    notes: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .default(""),
  });

export const updateBridalDressAppointmentSchema =
  createBridalDressAppointmentSchema.extend({
    id: z.string().uuid(),
  });

export type CreateBridalDressOptionInput =
  z.infer<
    typeof createBridalDressOptionSchema
  >;

export type UpdateBridalDressOptionInput =
  z.infer<
    typeof updateBridalDressOptionSchema
  >;

export type CreateBridalDressAppointmentInput =
  z.infer<
    typeof createBridalDressAppointmentSchema
  >;

export type UpdateBridalDressAppointmentInput =
  z.infer<
    typeof updateBridalDressAppointmentSchema
  >;
