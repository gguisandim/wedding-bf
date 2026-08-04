import { z } from "zod";

const weddingDateSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Informe uma data válida.",
  )
  .refine((value) => {
    const [year, month, day] = value
      .split("-")
      .map(Number);

    const date = new Date(
      Date.UTC(year, month - 1, day),
    );

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Informe uma data válida.");

const weddingTimeSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    "Informe um horário válido.",
  )
  .transform((value) =>
    value === "" ? null : value,
  );

const optionalTextSchema = (
  maximumLength: number,
  fieldName: string,
) =>
  z
    .string()
    .trim()
    .max(
      maximumLength,
      `${fieldName} deve possuir no máximo ${maximumLength} caracteres.`,
    )
    .transform((value) =>
      value === "" ? null : value,
    );

export const updateWeddingSchema = z.object({
  brideName: z
    .string()
    .trim()
    .min(
      2,
      "Informe o nome da noiva.",
    )
    .max(
      80,
      "O nome da noiva deve possuir no máximo 80 caracteres.",
    ),

  groomName: z
    .string()
    .trim()
    .min(
      2,
      "Informe o nome do noivo.",
    )
    .max(
      80,
      "O nome do noivo deve possuir no máximo 80 caracteres.",
    ),

  weddingDate: weddingDateSchema,

  weddingTime: weddingTimeSchema,

  venueName: optionalTextSchema(
    120,
    "O nome do local",
  ),

  venueAddress: optionalTextSchema(
    300,
    "O endereço",
  ),

  timezone: z.enum(
    [
      "America/Belem",
      "America/Sao_Paulo",
      "America/Manaus",
    ],
    {
      message:
        "Selecione um fuso horário válido.",
    },
  ),
});

export type UpdateWeddingInput = z.input<
  typeof updateWeddingSchema
>;

export type ValidatedWeddingData = z.output<
  typeof updateWeddingSchema
>;