import Link from "next/link";

const convidadosExemplo = [
  {
    id: 1,
    nome: "João da Silva",
    grupo: "Família da noiva",
    telefone: "(91) 99999-9999",
    acompanhantes: 1,
    status: "Pendente",
  },
  {
    id: 2,
    nome: "Maria Oliveira",
    grupo: "Amigos",
    telefone: "(91) 98888-8888",
    acompanhantes: 0,
    status: "Confirmado",
  },
  {
    id: 3,
    nome: "Carlos Santos",
    grupo: "Família do noivo",
    telefone: "(91) 97777-7777",
    acompanhantes: 2,
    status: "Recusado",
  },
];

function obterClasseStatus(status: string) {
  if (status === "Confirmado") {
    return "status confirmado";
  }

  if (status === "Recusado") {
    return "status recusado";
  }

  return "status pendente";
}

export default function ConvidadosPage() {
  const totalConvidados = convidadosExemplo.length;

  const totalConfirmados = convidadosExemplo.filter(
    (convidado) => convidado.status === "Confirmado"
  ).length;

  const totalPendentes = convidadosExemplo.filter(
    (convidado) => convidado.status === "Pendente"
  ).length;

  const totalAcompanhantes = convidadosExemplo.reduce(
    (total, convidado) => total + convidado.acompanhantes,
    0
  );

  return (
    <main className="pagina-convidados">
      <header className="cabecalho-pagina">
        <div>
          <span className="subtitulo">Organização do casamento</span>
          <h1>Convidados</h1>
          <p>
            Gerencie os convidados, acompanhantes e confirmações de presença.
          </p>
        </div>

        <Link href="/painel/convidados/novo" className="botao-principal">
          + Novo convidado
        </Link>
      </header>

      <section className="resumo-convidados">
        <article className="cartao-resumo">
          <span>Total de convidados</span>
          <strong>{totalConvidados}</strong>
        </article>

        <article className="cartao-resumo">
          <span>Confirmados</span>
          <strong>{totalConfirmados}</strong>
        </article>

        <article className="cartao-resumo">
          <span>Pendentes</span>
          <strong>{totalPendentes}</strong>
        </article>

        <article className="cartao-resumo">
          <span>Acompanhantes</span>
          <strong>{totalAcompanhantes}</strong>
        </article>
      </section>

      <section className="secao-tabela">
        <div className="barra-tabela">
          <div>
            <h2>Lista de convidados</h2>
            <p>{totalConvidados} convidados cadastrados</p>
          </div>

          <div className="filtros">
            <input
              type="search"
              placeholder="Buscar convidado..."
              aria-label="Buscar convidado"
            />

            <select defaultValue="todos" aria-label="Filtrar por status">
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="confirmado">Confirmados</option>
              <option value="recusado">Recusados</option>
            </select>
          </div>
        </div>

        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Grupo</th>
                <th>Telefone</th>
                <th>Acompanhantes</th>
                <th>Status</th>
                <th className="coluna-acoes">Ações</th>
              </tr>
            </thead>

            <tbody>
              {convidadosExemplo.map((convidado) => (
                <tr key={convidado.id}>
                  <td>
                    <div className="convidado">
                      <div className="avatar">
                        {convidado.nome.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{convidado.nome}</strong>
                        <span>Convidado principal</span>
                      </div>
                    </div>
                  </td>

                  <td>{convidado.grupo}</td>
                  <td>{convidado.telefone}</td>
                  <td>{convidado.acompanhantes}</td>

                  <td>
                    <span className={obterClasseStatus(convidado.status)}>
                      {convidado.status}
                    </span>
                  </td>

                  <td>
                    <div className="acoes">
                      <button type="button" className="botao-acao">
                        Editar
                      </button>

                      <button
                        type="button"
                        className="botao-acao botao-excluir"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .pagina-convidados {
          width: 100%;
          padding: 32px;
          color: #2f2a27;
        }

        .cabecalho-pagina {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 32px;
        }

        .subtitulo {
          display: block;
          margin-bottom: 6px;
          color: #9b7666;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .cabecalho-pagina h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
        }

        .cabecalho-pagina p {
          margin: 8px 0 0;
          color: #746b66;
        }

        .botao-principal {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 20px;
          border-radius: 10px;
          background: #8d6254;
          color: white;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: 0.2s;
        }

        .botao-principal:hover {
          background: #744c40;
        }

        .resumo-convidados {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .cartao-resumo {
          padding: 22px;
          border: 1px solid #eadfd9;
          border-radius: 14px;
          background: white;
          box-shadow: 0 4px 18px rgba(71, 48, 40, 0.05);
        }

        .cartao-resumo span {
          display: block;
          margin-bottom: 10px;
          color: #817671;
          font-size: 14px;
        }

        .cartao-resumo strong {
          font-size: 28px;
        }

        .secao-tabela {
          overflow: hidden;
          border: 1px solid #eadfd9;
          border-radius: 14px;
          background: white;
          box-shadow: 0 4px 18px rgba(71, 48, 40, 0.05);
        }

        .barra-tabela {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 22px;
          border-bottom: 1px solid #eee5e1;
        }

        .barra-tabela h2 {
          margin: 0;
          font-size: 19px;
        }

        .barra-tabela p {
          margin: 5px 0 0;
          color: #817671;
          font-size: 14px;
        }

        .filtros {
          display: flex;
          gap: 10px;
        }

        .filtros input,
        .filtros select {
          min-height: 40px;
          padding: 0 12px;
          border: 1px solid #ded3ce;
          border-radius: 9px;
          background: white;
          color: #403936;
          outline: none;
        }

        .filtros input {
          width: 230px;
        }

        .filtros input:focus,
        .filtros select:focus {
          border-color: #9b7666;
        }

        .tabela-container {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 16px 20px;
          border-bottom: 1px solid #f0e8e4;
          text-align: left;
          white-space: nowrap;
        }

        th {
          background: #fbf8f6;
          color: #726762;
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        td {
          color: #514945;
          font-size: 14px;
        }

        tbody tr:last-child td {
          border-bottom: none;
        }

        tbody tr:hover {
          background: #fdfaf8;
        }

        .convidado {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          display: flex;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #efe1db;
          color: #80594d;
          font-weight: 800;
        }

        .convidado strong,
        .convidado span {
          display: block;
        }

        .convidado span {
          margin-top: 3px;
          color: #948984;
          font-size: 12px;
        }

        .status {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .status.confirmado {
          background: #e3f4e8;
          color: #257341;
        }

        .status.pendente {
          background: #fff3d6;
          color: #956c08;
        }

        .status.recusado {
          background: #fde6e6;
          color: #a23838;
        }

        .coluna-acoes {
          text-align: right;
        }

        .acoes {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .botao-acao {
          padding: 7px 10px;
          border: 1px solid #dfd4cf;
          border-radius: 7px;
          background: white;
          color: #594e49;
          cursor: pointer;
        }

        .botao-acao:hover {
          background: #f7f1ee;
        }

        .botao-excluir {
          color: #a13c3c;
        }

        @media (max-width: 1000px) {
          .resumo-convidados {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .barra-tabela {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 700px) {
          .pagina-convidados {
            padding: 20px;
          }

          .cabecalho-pagina {
            flex-direction: column;
          }

          .botao-principal {
            width: 100%;
          }

          .resumo-convidados {
            grid-template-columns: 1fr;
          }

          .filtros {
            width: 100%;
            flex-direction: column;
          }

          .filtros input,
          .filtros select {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}