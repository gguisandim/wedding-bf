const DAY_IN_MILLISECONDS =
  24 * 60 * 60 * 1000;

function parseDateOnly(value: string): Date {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    throw new Error(
      `Data do casamento inválida: ${value}`,
    );
  }

  return new Date(
    Date.UTC(year, month - 1, day),
  );
}

function getCurrentDateInTimezone(
  timezone: string,
): Date {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).formatToParts(new Date());

  const year = Number(
    parts.find(
      (part) => part.type === "year",
    )?.value,
  );

  const month = Number(
    parts.find(
      (part) => part.type === "month",
    )?.value,
  );

  const day = Number(
    parts.find(
      (part) => part.type === "day",
    )?.value,
  );

  if (!year || !month || !day) {
    throw new Error(
      `Não foi possível calcular a data no fuso ${timezone}`,
    );
  }

  return new Date(
    Date.UTC(year, month - 1, day),
  );
}

export function formatCoupleName(
  brideName: string,
  groomName: string,
): string {
  return `${brideName} & ${groomName}`;
}

export function formatWeddingDateLong(
  weddingDate: string,
): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDateOnly(weddingDate));
}

export function formatWeddingDateCompact(
  weddingDate: string,
): string {
  const [year, month, day] =
    weddingDate.split("-");

  return `${day} · ${month} · ${year}`;
}

export function calculateDaysUntilWedding(
  weddingDate: string,
  timezone: string,
): number {
  const wedding =
    parseDateOnly(weddingDate);

  const today =
    getCurrentDateInTimezone(timezone);

  const difference =
    wedding.getTime() - today.getTime();

  return Math.max(
    0,
    Math.ceil(
      difference /
        DAY_IN_MILLISECONDS,
    ),
  );
}