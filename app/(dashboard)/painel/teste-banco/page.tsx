import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export default async function DatabaseTestPage() {
  const wedding = await requireCurrentWedding();

  return (
    <main style={{ padding: "32px" }}>
      <h1>Conexão com o banco</h1>

      <dl>
        <dt>ID do casamento</dt>
        <dd>{wedding.id}</dd>

        <dt>Casal</dt>
        <dd>
          {wedding.brideName} e {wedding.groomName}
        </dd>

        <dt>Data</dt>
        <dd>{formatDate(wedding.weddingDate)}</dd>

        <dt>Papel</dt>
        <dd>{wedding.role}</dd>

        <dt>Tipo de membro</dt>
        <dd>{wedding.memberType}</dd>

        <dt>Fuso horário</dt>
        <dd>{wedding.timezone}</dd>
      </dl>
    </main>
  );
}