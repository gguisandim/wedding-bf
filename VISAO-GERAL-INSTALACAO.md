# Visão geral conectada ao Supabase

Este pacote conecta a página `/painel` aos dados reais já existentes no sistema.

## Dados utilizados

### Convidados e RSVP

- total de convidados;
- confirmados;
- aguardando resposta;
- recusados;
- percentual de confirmação.

Fonte: `guests`.

### Financeiro

- valor total dos serviços;
- valor pago;
- saldo a pagar;
- contas dos próximos 30 dias;
- contas atrasadas;
- valor sem data definida;
- contas do mês atual e do próximo mês;
- pagamentos parciais.

Fontes:

- `budget_items`;
- `budget_installments`.

### Checklist

- total de tarefas;
- tarefas concluídas;
- tarefas pendentes;
- tarefas prioritárias ou atrasadas;
- próximos passos reais.

Fontes:

- `checklist_groups`;
- `checklist_tasks`.

### Cronograma

A visão geral monta o próximo compromisso usando:

- eventos manuais do cronograma;
- prazos do checklist;
- vencimentos do orçamento;
- data do casamento;
- compromissos do vestido para noiva/desenvolvedor.

Fonte principal: `calendar_events`, com integração dos demais módulos.

### Mesas

- total de mesas;
- capacidade total;
- confirmados com mesa;
- confirmados ainda sem mesa.

Fontes:

- `seating_tables`;
- `guest_table_assignments`;
- `guests`.

### Cerimônia

- quantidade de momentos;
- momentos confirmados;
- momentos que precisam de atenção;
- duração total prevista.

Fonte: `ceremony_blocks`.

### Área privada do vestido

Exibida somente para:

- `member_type = bride`;
- `member_type = developer`.

Mostra:

- opções cadastradas;
- opções escolhidas;
- próximo compromisso.

Fontes:

- `bridal_dress_options`;
- `bridal_dress_appointments`.

## Arquivos

Substituídos:

- `app/(dashboard)/painel/page.tsx`
- `components/dashboard/financialsummary.tsx`
- `components/dashboard/metricsgrid.tsx`
- `components/dashboard/monthlypayments.tsx`
- `components/dashboard/monthlypayments.module.css`
- `components/dashboard/nextsteps.tsx`

Adicionados:

- `lib/data/overview.ts`
- `components/dashboard/overview/modules-overview.tsx`
- `components/dashboard/overview/modules-overview.module.css`

## Banco de dados

Não existe migration nova. A visão geral apenas lê as tabelas já criadas pelos módulos.

## Instalação

Extraia o ZIP na raiz do projeto, substituindo os arquivos existentes.

Depois execute:

```bat
npm run build
npm run dev
```

Abra:

```text
http://localhost:3000/painel
```

## Validação

Os arquivos passaram por verificação sintática e por uma verificação TypeScript estrita das alterações.

O build completo não foi executado no ambiente de geração porque o espelho de pacotes disponível retornou erro 404 para `zod@4.4.3`. Execute `npm run build` no projeto local, onde as dependências já estão instaladas.
