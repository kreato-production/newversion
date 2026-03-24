# Inventario de Acoplamento com Supabase

## Objetivo

Registrar os principais pontos de dependencia atual com Supabase para orientar a migracao.

## Resumo Atual

Durante a Sprint 1 foi identificado:

- aproximadamente 82 referencias diretas de importacao do cliente Supabase no frontend
- aproximadamente 120 ocorrencias de uso operacional de `supabase.from`, `supabase.auth` ou `rpc`
- 2 edge functions administrativas em `supabase/functions`

Esses numeros servem como referencia inicial e nao como auditoria definitiva de linha a linha.

## Pontos de Acoplamento

### 1. Cliente compartilhado

Arquivo central:

- [client.ts](/c:/Projetos/Kreato_Local/kreatoproduction/src/integrations/supabase/client.ts)

Uso:

- inicializacao do cliente
- persistencia de sessao
- dependencia direta do frontend

### 2. Autenticacao

Arquivos principais:

- [AuthContext.tsx](/c:/Projetos/Kreato_Local/kreatoproduction/src/contexts/AuthContext.tsx)
- [Login.tsx](/c:/Projetos/Kreato_Local/kreatoproduction/src/pages/Login.tsx)

Dependencias atuais:

- `supabase.auth.signInWithPassword`
- `supabase.auth.onAuthStateChange`
- `supabase.auth.getSession`
- `supabase.auth.signOut`

Risco:

- regras de sessao e parte do controle de acesso dependem da plataforma e do cliente

### 3. CRUD distribuido no frontend

Arquivos com acoplamento direto espalhados por:

- `src/pages/admin`
- `src/pages/producao`
- `src/pages/recursos`
- `src/components/admin`
- `src/components/producao`
- `src/components/recursos`

Risco:

- alta dificuldade de trocar fornecedor
- regras de dados misturadas com UI

### 4. Hooks genericos

Arquivos principais:

- [useSupabaseData.ts](/c:/Projetos/Kreato_Local/kreatoproduction/src/hooks/useSupabaseData.ts)
- [usePermissions.ts](/c:/Projetos/Kreato_Local/kreatoproduction/src/hooks/usePermissions.ts)
- [useFormFieldConfig.tsx](/c:/Projetos/Kreato_Local/kreatoproduction/src/hooks/useFormFieldConfig.tsx)

Risco:

- abstraem o acesso ao Supabase, mas ainda prendem a aplicacao ao fornecedor

### 5. Permissoes e tenancy

Arquivos principais:

- [AuthContext.tsx](/c:/Projetos/Kreato_Local/kreatoproduction/src/contexts/AuthContext.tsx)
- [permissionsMatrix.ts](/c:/Projetos/Kreato_Local/kreatoproduction/src/data/permissionsMatrix.ts)
- [usePermissions.ts](/c:/Projetos/Kreato_Local/kreatoproduction/src/hooks/usePermissions.ts)

Risco:

- parte da decisao de acesso ainda nasce no frontend

### 6. Edge functions administrativas

Arquivos:

- [admin-create-user](/c:/Projetos/Kreato_Local/kreatoproduction/supabase/functions/admin-create-user/index.ts)
- [seed-admin](/c:/Projetos/Kreato_Local/kreatoproduction/supabase/functions/seed-admin/index.ts)

Risco:

- operacoes administrativas sensiveis dependentes do ecossistema Supabase

## Grupos Prioritarios para Migracao

### Prioridade alta

- autenticacao
- usuarios
- tenants
- unidades
- equipes

### Prioridade media

- dashboard
- permissoes
- formularios administrativos

### Prioridade alta de complexidade

- producao
- gravacoes
- conteudos
- mapas
- recursos

## Estrategia de Saida

1. encapsular dependencias em adaptadores
2. criar backend proprio
3. migrar modulos piloto
4. mover regras criticas para backend
5. substituir chamadas diretas por API propria
6. desativar Supabase progressivamente

## Resultado Esperado

Ao final da migracao:

- o frontend nao importara mais o cliente Supabase diretamente
- a autenticacao sera do backend proprio
- o PostgreSQL sera consumido apenas pelo backend
- edge functions do Supabase deixarao de ser necessarias
