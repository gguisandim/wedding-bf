# Revisão de usabilidade do orçamento

Substitua:

- components/dashboard/financeiro/budget-manager.tsx
- components/dashboard/financeiro/budget-manager.module.css
- lib/actions/budget.ts

Não há migration nova.

Principais correções:

- somente um campo visível: Valor total do serviço;
- planned_amount e contracted_amount continuam existindo e recebem o mesmo valor;
- fornecedor virou um único campo opcional de empresa/profissional;
- saldo restante usa o valor total do serviço, não apenas as parcelas cadastradas;
- mostra valor ainda sem data definida;
- impede parcelas acima do valor total;
- pagamentos parciais passam a ser somados;
- datas usam o horário local;
- novo painel visual com agenda de próximas contas.

Depois execute:

npm run build
npm run dev
