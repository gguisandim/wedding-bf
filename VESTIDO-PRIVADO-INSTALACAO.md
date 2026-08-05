# Área privada do vestido da noiva

A rota técnica continua sendo:

/painel/fornecedores

Nenhuma pasta principal foi renomeada.

Na interface, a rota aparece como:

Vestido da noiva

Somente membros com member_type `bride` ou `developer` veem o item da sidebar e conseguem acessar a página.

## Arquivos

- components/dashboard/sidebar.tsx
- app/(dashboard)/painel/fornecedores/page.tsx
- components/dashboard/vestido/bridal-dress-manager.tsx
- components/dashboard/vestido/bridal-dress-manager.module.css
- lib/actions/bridal-dress.ts
- lib/data/bridal-dress.ts
- lib/validations/bridal-dress.ts
- supabase/migrations/20260805014000_create_bridal_dress_private_area.sql

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
