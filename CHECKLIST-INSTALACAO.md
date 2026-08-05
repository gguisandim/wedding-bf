# Checklist funcional com Supabase

O pacote substitui o checklist estático por um módulo persistente.

## Funcionalidades

- criar, editar e excluir etapas;
- criar estrutura inicial com quatro etapas;
- criar, editar e excluir tarefas;
- prazo opcional com identificação de atraso;
- responsável dinâmico: noiva, noivo, casal, cerimonialista ou outra pessoa;
- prioridade normal, média ou alta;
- situação pendente, em andamento ou concluída;
- conclusão rápida pelo botão de seleção;
- busca e filtros;
- progresso geral e por etapa;
- campos `source_type` e `source_id` preparados para integração futura com cerimônia, orçamento, RSVP e cronograma;
- helper `getChecklistOverviewTasks` preparado para a visão geral.

## Arquivos

- `supabase/migrations/20260805023000_create_checklist.sql`
- `lib/validations/checklist.ts`
- `lib/actions/checklist.ts`
- `lib/data/checklist.ts`
- `app/(dashboard)/painel/checklist/page.tsx`
- `components/dashboard/checklist/checklist-manager.tsx`
- `components/dashboard/checklist/checklist-manager.module.css`

Os componentes antigos abaixo podem continuar no projeto, mas deixam de ser importados:

- `components/dashboard/checklist-header.tsx`
- `components/dashboard/checklist-group.tsx`
- `components/dashboard/checklist-task.tsx`

## Instalação

Extraia o ZIP na raiz do projeto.

Aplique a migration:

```bat
npx supabase db push --dry-run
npx supabase db push
```

Atualize os tipos:

```bat
npx supabase gen types typescript --linked --schema public > lib\supabase\database.types.ts
```

Valide:

```bat
npm run build
npm run dev
```

Abra:

```text
http://localhost:3000/painel/checklist
```

No primeiro acesso, use **Criar etapas iniciais**. Nenhuma tarefa fictícia é inserida; somente as quatro etapas organizacionais são criadas.
