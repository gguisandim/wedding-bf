import { z } from "zod";

const optionalText = (
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

const optionalEmail = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      z.string().email().safeParse(value).success,
    "Informe um e-mail válido.",
  )
  .transform((value) =>
    value === "" ? null : value,
  );

const optionalUuid = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      z.string().uuid().safeParse(value).success,
    "Identificador inválido.",
  )
  .transform((value) =>
    value === "" ? null : value,
  );

export const saveTheDateStatusSchema = z.enum([
  "not_ready",
  "ready",
  "sent",
  "delivered",
]);

export const guestSideSchema = z.enum([
  "bride",
  "groom",
  "both",
]);

export const guestConfirmationStatusSchema = z.enum([
  "pending",
  "confirmed",
  "declined",
]);

export const createInvitationGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Informe o nome do grupo de convite.",
    )
    .max(
      120,
      "O nome do grupo deve possuir no máximo 120 caracteres.",
    ),

  invitationCode: z
    .string()
    .trim()
    .max(
      30,
      "O código deve possuir no máximo 30 caracteres.",
    )
    .transform((value) =>
      value
        .toLocaleUpperCase("pt-BR")
        .replace(/[^A-Z0-9-]/g, ""),
    ),

  saveTheDateStatus:
    saveTheDateStatusSchema.default(
      "not_ready",
    ),

  recipientName: optionalText(
    150,
    "O nome do destinatário",
  ),

  postalCode: z
    .string()
    .trim()
    .max(
      9,
      "O CEP deve possuir no máximo 9 caracteres.",
    )
    .transform((value) =>
      value === "" ? null : value,
    ),

  street: optionalText(
    180,
    "A rua",
  ),

  streetNumber: optionalText(
    30,
    "O número",
  ),

  complement: optionalText(
    120,
    "O complemento",
  ),

  neighborhood: optionalText(
    100,
    "O bairro",
  ),

  city: optionalText(
    100,
    "A cidade",
  ),

  state: z
    .string()
    .trim()
    .transform((value) =>
      value.toLocaleUpperCase("pt-BR"),
    )
    .refine(
      (value) =>
        value === "" ||
        /^[A-Z]{2}$/.test(value),
      "Informe uma UF válida.",
    )
    .transform((value) =>
      value === "" ? null : value,
    ),

  notes: optionalText(
    1000,
    "As observações",
  ),
});

export const createGuestSchema = z.object({
  invitationGroupId: z
    .string()
    .uuid(
      "Selecione um grupo de convite válido.",
    ),

  fullName: z
    .string()
    .trim()
    .min(
      2,
      "Informe o nome completo do convidado.",
    )
    .max(
      150,
      "O nome deve possuir no máximo 150 caracteres.",
    ),

  preferredName: optionalText(
    80,
    "O nome preferido",
  ),

  email: optionalEmail,

  phone: optionalText(
    30,
    "O telefone",
  ),

  side: guestSideSchema.default("both"),

  confirmationStatus:
    guestConfirmationStatusSchema.default(
      "pending",
    ),

  isPrimary: z.boolean().default(false),

  isChild: z.boolean().default(false),

  linkedGuestId: optionalUuid,

  relationshipLabel: optionalText(
    80,
    "O vínculo",
  ),

  dietaryRestrictions: optionalText(
    500,
    "As restrições alimentares",
  ),

  notes: optionalText(
    1000,
    "As observações",
  ),
});

export const updateInvitationGroupSchema =
  createInvitationGroupSchema.extend({
    id: z.string().uuid(
      "Grupo de convite inválido.",
    ),
  });

export const updateGuestSchema =
  createGuestSchema.extend({
    id: z.string().uuid(
      "Convidado inválido.",
    ),
  });

export type CreateInvitationGroupInput =
  z.input<
    typeof createInvitationGroupSchema
  >;

export type ValidatedInvitationGroupData =
  z.output<
    typeof createInvitationGroupSchema
  >;

export type CreateGuestInput =
  z.input<typeof createGuestSchema>;

export type ValidatedGuestData =
  z.output<typeof createGuestSchema>;

export type UpdateInvitationGroupInput =
  z.input<
    typeof updateInvitationGroupSchema
  >;

export type UpdateGuestInput =
  z.input<typeof updateGuestSchema>;