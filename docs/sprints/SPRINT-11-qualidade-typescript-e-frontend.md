# SPRINT-11 — Qualidade TypeScript e Refatoração Frontend

## Objetivo

Elevar a qualidade de código do frontend alinhando-o ao rigor do backend, corrigir padrões
frágeis no TypeScript e melhorar a performance de carregamento com lazy loading.

## Duração sugerida

2 semanas

## Resultados esperados

- Frontend com TypeScript mais rigoroso (sem `any` implícito)
- Rotas carregadas sob demanda (lazy loading)
- Paginação nos endpoints de listagem do backend
- Código morto e duplicações eliminados
- Logs do backend via Fastify logger (sem `console.warn`)

## Escopo

- Ativação gradual do TypeScript strict no frontend
- Lazy loading com `React.lazy` + `Suspense`
- Paginação nos repositories e rotas do backend
- Substituição de non-null assertions por tipos seguros nas rotas
- Extração de funções de mapeamento duplicadas nos services
- `console.warn` → logger do Fastify
- Reativar `no-unused-vars` no ESLint
- Renomear pacote e configurar `QueryClient`

## Entregáveis

- `tsconfig.app.json` com `noImplicitAny: true` (primeiro passo)
- App.tsx com rotas em lazy loading
- Endpoints de listagem com `limit`/`offset`
- Tipos seguros para `request.user` em todas as rotas
- Funções de mapeamento centralizadas por módulo
- Zero `console.warn`/`console.log` no código de produção do backend
- ESLint com `no-unused-vars: warn`

## Tarefas

### 1. TypeScript strict gradual no frontend
- **Arquivo:** `tsconfig.app.json`
- **Fase 1 (esta sprint):** Habilitar apenas `noImplicitAny: true`
- Corrigir todos os erros resultantes (use `// @ts-expect-error` com comentário apenas quando estritamente necessário)
- **Fase 2 (sprint futura):** `strictNullChecks: true` após fase 1 estabilizada

### 2. Lazy loading no App.tsx
- **Arquivo:** `src/App.tsx`
- Converter todas as importações estáticas de páginas para `React.lazy()`
- Envolver rotas em `<Suspense fallback={<PageLoader />}>` por grupo (admin, producao, recursos)
- Criar componente `PageLoader` reutilizável com skeleton ou spinner

### 3. Paginação nos endpoints de listagem
- **Backend:**
  - Adicionar parâmetros `limit` (default: 50, max: 200) e `offset` (default: 0) nas interfaces de repository
  - Atualizar todos os `findByTenantId()` nos repositories para usar `LIMIT`/`OFFSET` no Prisma
  - Retornar `{ data: [], total: number }` em todos os endpoints de listagem
- **Frontend:**
  - Atualizar chamadas de API para passar `limit` e `offset`
  - Implementar paginação simples (anterior/próxima) nos componentes de listagem

### 4. Tipos seguros para `request.user` nas rotas
- **Arquivos:** todos os `backend/src/modules/*/routes/index.ts`
- O padrão atual usa `request.user!` (non-null assertion) em todas as rotas protegidas
- Criar tipo utilitário `AuthenticatedRequest` que extende `FastifyRequest` com `user: AuthenticatedUser` (não nullable)
- Substituir todos os `request.user!` pelo tipo correto via cast seguro no início do handler

### 5. Extrair funções de mapeamento nos services
- **Arquivos:** `gravacoes`, `programas`, `equipes`, `unidades`, `users` em `backend/src/modules/`
- Cada service repete lógica de mapeamento entre `list()` e `save()` / `getById()`
- Extrair para função `mapToDto(record)` privada em cada módulo

### 6. Substituir `console.warn` por logger Fastify
- **Arquivo:** `backend/src/modules/auth/auth.repository.ts` (linha 217)
- O bloco `catch` usa `console.warn` em vez do logger injetado
- Injetar `FastifyBaseLogger` no `PrismaAuthRepository` via construtor
- Substituir `console.warn(...)` por `this.logger.warn(...)`

### 7. Reativar no-unused-vars no ESLint
- **Arquivo:** `eslint.config.js`
- Mudar `"@typescript-eslint/no-unused-vars": "off"` para `"warn"`
- Corrigir ou remover todas as variáveis não utilizadas encontradas

### 8. Renomear pacote e configurar QueryClient
- **Arquivo:** `package.json` (raiz)
- Renomear `name` de `vite_react_shadcn_ts` para `kreato-frontend`
- **Arquivo:** `src/App.tsx`
- Configurar `QueryClient` com: `staleTime: 60_000`, `retry: 1`, `refetchOnWindowFocus: false`

## Critérios de Aceitação

- [ ] `npx tsc --noEmit` no frontend sem erros de `noImplicitAny`
- [ ] DevTools mostra chunks separados por grupo de rotas no Network
- [ ] `GET /programas` com `?limit=10&offset=0` retorna `{ data: [...], total: N }`
- [ ] Zero `request.user!` nos arquivos de rotas do backend
- [ ] Zero `console.warn`/`console.log` no código de produção do backend
- [ ] `eslint .` sem erros de `no-unused-vars` (warnings resolvidos ou justificados)
