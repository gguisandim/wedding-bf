# Cerimônia funcional com Supabase

Este pacote substitui a cerimônia estática por um roteiro persistente.

## Funcionalidades

- criar, editar, duplicar e excluir momentos;
- alterar a ordem por arrastar ou pelas setas;
- recalcular horários automaticamente pela ordem e duração;
- definir tipo, situação, responsável, participantes e orientações;
- criar um roteiro inicial;
- cadastrar e concluir tarefas dentro de cada momento;
- exibir as mesmas tarefas no checklist geral, sem duplicação.

## Integração com o checklist

As tarefas da cerimônia usam a tabela `checklist_tasks` com:

- `source_type = ceremony`;
- `source_id = id do momento`.

A etapa “Cerimônia” é criada automaticamente quando a primeira tarefa é adicionada.
A migration do checklist precisa estar aplicada antes deste módulo.

## Instalação

Extraia o ZIP na raiz do projeto e execute:

npx supabase db push --dry-run
npx supabase db push
npx supabase gen types typescript --linked --schema public > lib\supabase\database.types.ts
npm run build
npm run dev

Abra:

http://localhost:3000/painel/cerimonia
