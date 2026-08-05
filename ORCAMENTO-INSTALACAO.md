# Orçamento focado em contas a pagar

O módulo foi organizado para que o objetivo principal seja:

1. cadastrar um serviço ou despesa;
2. entrar nesse serviço;
3. cadastrar cada conta, parcela ou entrada;
4. informar valor e data limite;
5. visualizar o próximo pagamento, atrasos e total pendente;
6. reutilizar esses dados na visão geral.

## Instalação

Extraia o ZIP na raiz do projeto.

Aplique a migration:

npx supabase db push --dry-run
npx supabase db push

Atualize os tipos:

npx supabase gen types typescript --linked --schema public > lib\supabase\database.types.ts

Valide:

npm run build
npm run dev

## Visão geral

O pacote também inclui:

- lib/data/upcoming-payables.ts
- components/dashboard/overview/upcoming-payments-card.tsx
- components/dashboard/overview/upcoming-payments-card.module.css

Para conectar a cédula ao painel principal, carregue:

const items = await getUpcomingPayables(wedding.id, 5);

e renderize:

<UpcomingPaymentsCard items={items} />

A integração exata depende do conteúdo atual de app/(dashboard)/painel/page.tsx.
