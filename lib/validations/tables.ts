import { z } from "zod";

export const seatingTableShapeSchema =
  z.enum([
    "round",
    "rectangular",
    "square",
  ]);

export const createSeatingTableSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Informe o nome da mesa.",
      )
      .max(80),

    shape:
      seatingTableShapeSchema,

    capacity: z
      .number()
      .int()
      .min(1)
      .max(30),

    positionX: z
      .number()
      .min(0)
      .max(100)
      .default(20),

    positionY: z
      .number()
      .min(0)
      .max(100)
      .default(20),

    rotation: z
      .number()
      .int()
      .min(0)
      .max(359)
      .default(0),

    notes: z
      .string()
      .trim()
      .max(500)
      .optional()
      .default(""),
  });

export const updateSeatingTableSchema =
  createSeatingTableSchema.extend({
    id: z.string().uuid(),
  });

export const assignGuestToTableSchema =
  z.object({
    guestId: z.string().uuid(),
    tableId: z.string().uuid(),
  });

export const unassignGuestFromTableSchema =
  z.object({
    guestId: z.string().uuid(),
  });

export const updateTablePositionSchema =
  z.object({
    tableId: z.string().uuid(),

    positionX: z
      .number()
      .min(0)
      .max(100),

    positionY: z
      .number()
      .min(0)
      .max(100),
  });

export type SeatingTableShape =
  z.infer<
    typeof seatingTableShapeSchema
  >;

export type CreateSeatingTableInput =
  z.infer<
    typeof createSeatingTableSchema
  >;

export type UpdateSeatingTableInput =
  z.infer<
    typeof updateSeatingTableSchema
  >;
