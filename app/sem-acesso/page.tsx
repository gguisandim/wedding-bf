import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px",
      }}
    >
      <section
        style={{
          maxWidth: "520px",
          textAlign: "center",
        }}
      >
        <h1>Acesso não autorizado</h1>

        <p>
          Sua conta não possui acesso a este casamento ou a esta
          área da aplicação.
        </p>

        <Link href="/painel">
          Voltar ao painel
        </Link>
      </section>
    </main>
  );
}