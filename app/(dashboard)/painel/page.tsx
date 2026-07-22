import Link from "next/link";
import {
  RamoBotanico,
  LouroLateral,
  IconePessoas,
  IconeCheck,
  IconeCifrao,
  IconeTarefas,
  IconePredio,
} from "@/components/ornamentos";

const proximasTarefas = [
  {
    id: 1,
    titulo: "Confirmar buffet",
    prazo: "25/07/2026",
    prioridade: "Alta",
  },
  {
    id: 2,
    titulo: "Escolher músicas da cerimônia",
    prazo: "30/07/2026",
    prioridade: "Média",
  },
  {
    id: 3,
    titulo: "Revisar lista de convidados",
    prazo: "02/08/2026",
    prioridade: "Baixa",
  },
];

const atividadesRecentes = [
  {
    id: 1,
    titulo: "Maria Oliveira confirmou presença",
    horario: "Hoje, às 14:35",
  },
  {
    id: 2,
    titulo: "Fornecedor Buffet Sabor & Arte foi cadastrado",
    horario: "Ontem, às 18:20",
  },
  {
    id: 3,
    titulo: "Pagamento da decoração foi registrado",
    horario: "Ontem, às 11:10",
  },
];

function classePrioridade(prioridade: string) {
  if (prioridade === "Alta") {
    return "prioridade alta";
  }

  if (prioridade === "Média") {
    return "prioridade media";
  }

  return "prioridade baixa";
}


export default function PainelPage() {
  const totalConvidados = 126;
  const confirmados = 84;
  const pendentes = 35;
  const recusados = 7;

  const orcamentoTotal = 50000;
  const valorPago = 18750;
  const valorPendente = 12200;

  const percentualConfirmados = Math.round(
    (confirmados / totalConvidados) * 100
  );

  const percentualOrcamento = Math.round(
    ((valorPago + valorPendente) / orcamentoTotal) * 100
  );

  return (
    <main className="pagina-visao-geral">
      <header className="cabecalho-pagina">
        <div>
          <span className="subtitulo">Painel administrativo</span>
          <h1>Visão geral</h1>
          <RamoBotanico className="divisor-ramo" />
          <p>
            Acompanhe os principais dados e pendências da organização do
            casamento.
          </p>
        </div>

        <div className="data-casamento">
          <span>Data do casamento</span>
          <div className="data-moldura">
            <LouroLateral />
            <strong>
              18<em>.</em>07<em>.</em>2027
            </strong>
            <LouroLateral flip />
          </div>
        </div>
      </header>

      <section className="cards-principais">
        <article className="card-indicador tom-azul">
          <div className="icone-card"><IconePessoas /></div>

          <div>
            <span>Total de convidados</span>
            <strong>{totalConvidados}</strong>
            <small>{confirmados} confirmados</small>
          </div>
        </article>

        <article className="card-indicador tom-sage">
          <div className="icone-card"><IconeCheck /></div>

          <div>
            <span>Confirmações</span>
            <strong>{percentualConfirmados}%</strong>
            <small>{pendentes} respostas pendentes</small>
          </div>
        </article>

        <article className="card-indicador tom-butter">
          <div className="icone-card"><IconeCifrao /></div>

          <div>
            <span>Valor pago</span>
            <strong>
              {valorPago.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
            <small>{percentualOrcamento}% do orçamento utilizado</small>
          </div>
        </article>

        <article className="card-indicador tom-clay">
          <div className="icone-card"><IconeTarefas /></div>

          <div>
            <span>Tarefas pendentes</span>
            <strong>12</strong>
            <small>3 com prioridade alta</small>
          </div>
        </article>
      </section>

      <section className="grade-conteudo">
        <article className="cartao painel-confirmacoes">
          <div className="cabecalho-cartao">
            <div>
              <span className="rotulo-cartao">Convidados</span>
              <h2>Confirmações de presença</h2>
              <p>Situação atual da lista de convidados</p>
            </div>

            <Link href="/painel/convidados">Ver convidados →</Link>
          </div>

          <div className="barra-progresso">
            <div
              className="barra-preenchida"
              style={{ width: `${percentualConfirmados}%` }}
            />
          </div>

          <div className="resumo-confirmacoes">
            <div>
              <span className="marcador confirmado" />
              <p>Confirmados</p>
              <strong>{confirmados}</strong>
            </div>

            <div>
              <span className="marcador pendente" />
              <p>Pendentes</p>
              <strong>{pendentes}</strong>
            </div>

            <div>
              <span className="marcador recusado" />
              <p>Recusados</p>
              <strong>{recusados}</strong>
            </div>
          </div>
        </article>

        <article className="cartao painel-orcamento">
          <div className="cabecalho-cartao">
            <div>
              <span className="rotulo-cartao">Orçamento</span>
              <h2>Resumo financeiro</h2>
              <p>Controle do orçamento do casamento</p>
            </div>

            <Link href="/painel/financeiro">Ver financeiro →</Link>
          </div>

          <div className="orcamento-total">
            <span>Orçamento total</span>

            <strong>
              {orcamentoTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>

          <div className="barra-progresso">
            <div
              className="barra-preenchida"
              style={{ width: `${percentualOrcamento}%` }}
            />
          </div>

          <div className="valores-financeiros">
            <div>
              <span>Pago</span>
              <strong>
                {valorPago.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>

            <div>
              <span>Pendente</span>
              <strong>
                {valorPendente.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>

            <div>
              <span>Disponível</span>
              <strong>
                {(orcamentoTotal - valorPago - valorPendente).toLocaleString(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                )}
              </strong>
            </div>
          </div>
        </article>

        <article className="cartao painel-tarefas">
          <div className="cabecalho-cartao">
            <div>
              <span className="rotulo-cartao">Checklist</span>
              <h2>Próximas tarefas</h2>
              <p>Atividades que exigem atenção</p>
            </div>

            <Link href="/painel/tarefas">Ver tarefas →</Link>
          </div>

          <div className="lista-tarefas">
            {proximasTarefas.map((tarefa) => (
              <div className="item-tarefa" key={tarefa.id}>
                <div className="checkbox-falso" />

                <div className="conteudo-tarefa">
                  <strong>{tarefa.titulo}</strong>
                  <span>Prazo: {tarefa.prazo}</span>
                </div>

                <span className={classePrioridade(tarefa.prioridade)}>
                  {tarefa.prioridade}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="cartao painel-atividades">
          <div className="cabecalho-cartao">
            <div>
              <span className="rotulo-cartao">Histórico</span>
              <h2>Atividades recentes</h2>
              <p>Últimas atualizações do sistema</p>
            </div>
          </div>

          <div className="lista-atividades">
            {atividadesRecentes.map((atividade) => (
              <div className="item-atividade" key={atividade.id}>
                <span className="ponto-atividade" />

                <div>
                  <strong>{atividade.titulo}</strong>
                  <span>{atividade.horario}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="atalhos">
        <div className="cabecalho-atalhos">
          <h2>Acesso rápido</h2>
          <p>Atalhos para os principais módulos</p>
        </div>

        <div className="grade-atalhos">
          <Link href="/painel/convidados" className="atalho">
            <span><IconePessoas /></span>
            <div>
              <strong>Convidados</strong>
              <small>Gerenciar lista e confirmações</small>
            </div>
          </Link>

          <Link href="/painel/financeiro" className="atalho">
            <span><IconeCifrao /></span>
            <div>
              <strong>Financeiro</strong>
              <small>Controlar despesas e pagamentos</small>
            </div>
          </Link>

          <Link href="/painel/fornecedores" className="atalho">
            <span><IconePredio /></span>
            <div>
              <strong>Fornecedores</strong>
              <small>Contratos e contatos</small>
            </div>
          </Link>

          <Link href="/painel/tarefas" className="atalho">
            <span><IconeCheck /></span>
            <div>
              <strong>Tarefas</strong>
              <small>Acompanhar o checklist</small>
            </div>
          </Link>
        </div>
      </section>

      <style>{`
        .pagina-visao-geral {
          width: 100%;
          padding: 40px 32px;
          background: var(--bg);
          color: var(--ink);
          font-family: var(--font-body), 'Jost', sans-serif;
        }

        .pagina-visao-geral h1,
        .pagina-visao-geral h2,
        .pagina-visao-geral strong {
          font-family: var(--font-display), 'Cormorant Garamond', serif;
          font-weight: 600;
        }

        .cabecalho-pagina {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 34px;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--line);
        }

        .subtitulo {
          display: block;
          margin-bottom: 8px;
          color: var(--blue-deep);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .cabecalho-pagina h1 {
          margin: 0;
          font-size: 40px;
          line-height: 1.15;
          letter-spacing: 0.01em;
          color: var(--ink);
        }

        .divisor-ramo {
          margin: 14px 0 12px;
          color: var(--sage);
        }

        .cabecalho-pagina p {
          margin: 0;
          max-width: 44ch;
          color: var(--ink-soft);
          font-size: 15px;
          line-height: 1.5;
        }

        .data-casamento {
          padding: 18px 22px;
          border: 1px solid var(--line);
          border-radius: 4px;
          background: var(--surface);
          text-align: center;
          flex-shrink: 0;
        }

        .data-casamento > span {
          display: block;
          margin-bottom: 10px;
          color: var(--ink-soft);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .data-moldura {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--sage);
        }

        .data-moldura strong {
          font-size: 22px;
          font-style: italic;
          font-weight: 500;
          color: var(--blue-deep);
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .data-moldura strong em {
          margin: 0 3px;
          font-style: normal;
          color: var(--sage);
        }

        .cards-principais {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 26px;
        }

        .card-indicador {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 22px;
          border: 1px solid var(--line);
          border-top: 3px solid var(--blue-mid);
          border-radius: 6px;
          background: var(--surface);
          box-shadow: 0 6px 20px rgba(59, 51, 44, 0.05);
        }

        .card-indicador.tom-azul { border-top-color: var(--blue-mid); }
        .card-indicador.tom-sage { border-top-color: var(--sage); }
        .card-indicador.tom-butter { border-top-color: var(--butter); }
        .card-indicador.tom-clay { border-top-color: var(--clay); }

        .icone-card {
          display: flex;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--surface-soft);
          color: var(--blue-deep);
        }

        .card-indicador.tom-azul .icone-card { background: var(--blue-pale); color: var(--blue-deep); }
        .card-indicador.tom-sage .icone-card { background: var(--sage-soft); color: var(--sage); }
        .card-indicador.tom-butter .icone-card { background: var(--butter-soft); color: #93762C; }
        .card-indicador.tom-clay .icone-card { background: var(--clay-soft); color: var(--clay); }

        .card-indicador span,
        .card-indicador strong,
        .card-indicador small {
          display: block;
        }

        .card-indicador span {
          margin-bottom: 4px;
          color: var(--ink-soft);
          font-size: 12px;
          font-weight: 500;
        }

        .card-indicador strong {
          margin-bottom: 3px;
          font-size: 28px;
          font-weight: 600;
        }

        .card-indicador small {
          color: var(--ink-soft);
          font-size: 11.5px;
        }

        .grade-conteudo {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .cartao {
          padding: 26px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--surface);
          box-shadow: 0 6px 20px rgba(59, 51, 44, 0.05);
        }

        .cabecalho-cartao {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .rotulo-cartao {
          display: block;
          margin-bottom: 6px;
          color: var(--sage);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .cabecalho-cartao h2 {
          margin: 0;
          font-size: 21px;
          font-weight: 600;
        }

        .cabecalho-cartao p {
          margin: 5px 0 0;
          color: var(--ink-soft);
          font-size: 13px;
        }

        .cabecalho-cartao a {
          color: var(--blue-deep);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
        }

        .cabecalho-cartao a:hover {
          text-decoration: underline;
        }

        .barra-progresso {
          width: 100%;
          height: 7px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--surface-soft);
        }

        .barra-preenchida {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--blue-deep), var(--blue-mid));
        }

        .resumo-confirmacoes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 24px;
        }

        .resumo-confirmacoes div {
          position: relative;
          padding-left: 16px;
        }

        .resumo-confirmacoes p,
        .resumo-confirmacoes strong {
          margin: 0;
        }

        .resumo-confirmacoes p {
          color: var(--ink-soft);
          font-size: 12px;
        }

        .resumo-confirmacoes strong {
          display: block;
          margin-top: 4px;
          font-size: 22px;
          font-weight: 600;
        }

        .marcador {
          position: absolute;
          top: 4px;
          left: 0;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .marcador.confirmado { background: var(--sage); }
        .marcador.pendente { background: var(--butter); }
        .marcador.recusado { background: var(--clay); }

        .orcamento-total {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .orcamento-total span {
          color: var(--ink-soft);
          font-size: 13px;
        }

        .orcamento-total strong {
          font-size: 25px;
          font-weight: 600;
        }

        .valores-financeiros {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 22px;
        }

        .valores-financeiros div {
          padding: 12px;
          border-radius: 6px;
          background: var(--surface-soft);
        }

        .valores-financeiros span,
        .valores-financeiros strong {
          display: block;
        }

        .valores-financeiros span {
          margin-bottom: 6px;
          color: var(--ink-soft);
          font-size: 12px;
        }

        .valores-financeiros strong {
          font-size: 15px;
          font-weight: 600;
        }

        .lista-tarefas,
        .lista-atividades {
          display: flex;
          flex-direction: column;
        }

        .item-tarefa {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid var(--line);
        }

        .item-tarefa:last-child,
        .item-atividade:last-child {
          border-bottom: none;
        }

        .checkbox-falso {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
          border: 1.5px solid var(--blue-soft);
          border-radius: 4px;
        }

        .conteudo-tarefa {
          min-width: 0;
          flex: 1;
        }

        .conteudo-tarefa strong,
        .conteudo-tarefa span {
          display: block;
        }

        .conteudo-tarefa strong {
          margin-bottom: 4px;
          font-size: 15px;
          font-weight: 500;
          font-family: var(--font-body), 'Jost', sans-serif;
        }

        .conteudo-tarefa span {
          color: var(--ink-soft);
          font-size: 12px;
        }

        .prioridade {
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }

        .prioridade.alta {
          background: var(--clay-soft);
          color: var(--clay);
        }

        .prioridade.media {
          background: var(--butter-soft);
          color: #93762C;
        }

        .prioridade.baixa {
          background: var(--sage-soft);
          color: var(--sage);
        }

        .item-atividade {
          display: flex;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid var(--line);
        }

        .ponto-atividade {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          margin-top: 6px;
          border: 1.5px solid var(--blue-deep);
          border-radius: 50%;
        }

        .item-atividade strong,
        .item-atividade span {
          display: block;
        }

        .item-atividade strong {
          margin-bottom: 5px;
          font-size: 15px;
          font-weight: 500;
          font-family: var(--font-body), 'Jost', sans-serif;
        }

        .item-atividade span {
          color: var(--ink-soft);
          font-size: 12px;
        }

        .atalhos {
          padding: 26px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--surface);
          box-shadow: 0 6px 20px rgba(59, 51, 44, 0.05);
        }

        .cabecalho-atalhos {
          margin-bottom: 18px;
        }

        .cabecalho-atalhos h2 {
          margin: 0;
          font-size: 21px;
          font-weight: 600;
        }

        .cabecalho-atalhos p {
          margin: 5px 0 0;
          color: var(--ink-soft);
          font-size: 13px;
        }

        .grade-atalhos {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .atalho {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 16px;
          border: 1px solid var(--line);
          border-radius: 6px;
          color: var(--ink);
          text-decoration: none;
          transition: 0.2s ease;
        }

        .atalho:hover {
          border-color: var(--blue-soft);
          background: var(--surface-soft);
          transform: translateY(-2px);
        }

        .atalho > span {
          display: flex;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--blue-pale);
          color: var(--blue-deep);
        }

        .atalho strong,
        .atalho small {
          display: block;
        }

        .atalho strong {
          margin-bottom: 4px;
          font-size: 15px;
          font-weight: 500;
        }

        .atalho small {
          color: var(--ink-soft);
          font-size: 11.5px;
          line-height: 1.4;
        }

        @media (prefers-reduced-motion: reduce) {
          .atalho {
            transition: none;
          }
        }

        @media (max-width: 1150px) {
          .cards-principais {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .grade-atalhos {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 800px) {
          .pagina-visao-geral {
            padding: 24px 20px;
          }

          .cabecalho-pagina {
            flex-direction: column;
          }

          .data-casamento {
            width: 100%;
          }

          .grade-conteudo {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .cards-principais,
          .grade-atalhos {
            grid-template-columns: 1fr;
          }

          .resumo-confirmacoes,
          .valores-financeiros {
            grid-template-columns: 1fr;
          }

          .cabecalho-cartao {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}