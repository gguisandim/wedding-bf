# Módulo de Mesas

Este pacote cria a primeira versão funcional do módulo de mesas:

- mesas persistidas no Supabase;
- capacidade e formato;
- vista superior do salão;
- arrastar mesas e salvar posição;
- visualização em lista;
- atribuir e remover convidados;
- impedir lotação acima da capacidade;
- impedir que convidados que recusaram sejam atribuídos;
- RLS para membros, owners e admins.

## Ordem de instalação

1. Extraia o ZIP na raiz do projeto.
2. Aplique a migration:
   npx supabase db push --dry-run
   npx supabase db push
3. Gere novamente os tipos:
   npx supabase gen types typescript --linked --schema public > lib\supabase\database.types.ts
4. Rode:
   npm run build
   npm run dev
