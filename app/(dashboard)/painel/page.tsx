export default function PainelPage() {
  return (
    <div className="dashboard-page">
      <div>
        <span
          style={{
            display: "block",
            marginBottom: "10px",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--dashboard-primary)",
          }}
        >
          Visão geral
        </span>

        <h1
          style={{
            margin: 0,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: "48px",
            fontWeight: 400,
          }}
        >
          Estrutura do painel
        </h1>
      </div>
    </div>
  );
}