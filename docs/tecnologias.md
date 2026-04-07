# Tecnologias do Projeto Kreato

## Visão Geral

O Kreato é um sistema de gestão de produção audiovisual organizado como um **monorepo de duas aplicações independentes**:

- **Frontend** — Next.js (raiz do repositório)
- **Backend** — Fastify (`backend/`)

---

## Infraestrutura

| Tecnologia | Versão | Função |
|---|---|---|
| Docker / Docker Compose | — | Orquestração local dos serviços |
| PostgreSQL | 16 (Alpine) | Banco de dados relacional principal |
| Keycloak | 24.0 | Identity Provider (SSO via OIDC) — opcional |

---

## Backend (`backend/`)

### Runtime e Framework

| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | — | Runtime JavaScript |
| TypeScript | ^5.8 | Linguagem tipada |
| Fastify | ^5.2 | Framework HTTP — alta performance, schema-first |
| tsx | ^4.19 | Execução de TypeScript com hot-reload em desenvolvimento |

### Banco de Dados

| Tecnologia | Versão | Função |
|---|---|---|
| Prisma ORM | ^6.6 | Modelagem de schema, migrations e client gerado |
| `@prisma/client` | ^6.6 | Client gerado para acesso ao banco |
| PostgreSQL | 16 | Banco relacional (via Docker) |

### Plugins Fastify

| Plugin | Função |
|---|---|
| `@fastify/cookie` | Leitura e escrita de cookies HttpOnly |
| `@fastify/cors` | Controle de CORS para o frontend |
| `@fastify/helmet` | Headers de segurança HTTP |
| `@fastify/rate-limit` | Limitação de requisições por IP |
| `@fastify/swagger` | Geração automática da spec OpenAPI |
| `@fastify/swagger-ui` | Interface visual da documentação da API |

### Autenticação e Segurança

| Tecnologia | Função |
|---|---|
| `jose` (^6.2) | Geração e validação de JWTs (RS256/HS256) |
| `scrypt` (Node built-in) | Hash de senhas |
| SHA-256 (Node built-in) | Hash de tokens de revogação |
| OIDC Discovery | Validação de tokens Keycloak via `/.well-known/openid-configuration` |
| Cookies HttpOnly | Armazenamento de `kreato_access_token` e `kreato_refresh_token` |

### Validação

| Tecnologia | Versão | Função |
|---|---|---|
| Zod | ^3.24 | Validação de schemas de request/response e variáveis de ambiente |

### Testes

| Tecnologia | Versão | Função |
|---|---|---|
| Vitest | ^3.0 | Framework de testes unitários e de integração |

---

## Frontend (raiz)

### Runtime e Framework

| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | — | Runtime JavaScript |
| TypeScript | ^5.8 | Linguagem tipada |
| React | ^18.3 | Biblioteca de UI |
| Next.js | ^16.2 (Turbopack) | Framework full-stack com App Router, SSR e API Routes |

### Autenticação

| Tecnologia | Versão | Função |
|---|---|---|
| NextAuth.js (Auth.js v5) | ^5.0.0-beta.30 | Sessão JWT via cookies HttpOnly, Credentials provider, Keycloak OIDC |
| `@auth/prisma-adapter` | ^2.11 | Persistência de contas OAuth e tokens de verificação no banco |

### Estilo e UI

| Tecnologia | Versão | Função |
|---|---|---|
| Tailwind CSS | ^3.4 | Framework CSS utilitário |
| shadcn/ui | — | Componentes acessíveis baseados em Radix UI + Tailwind |
| Radix UI | várias | Primitivos de UI acessíveis (Dialog, Select, Tooltip, etc.) |
| `class-variance-authority` | ^0.7 | Variantes de componentes com Tailwind |
| `tailwind-merge` | ^2.6 | Merge inteligente de classes Tailwind |
| `tailwindcss-animate` | ^1.0 | Animações para Tailwind |
| `lucide-react` | ^0.462 | Ícones SVG em React |
| `next-themes` | ^0.3 | Alternância dark/light mode |
| `cmdk` | ^1.1 | Paleta de comandos (Command Menu) |
| `sonner` | ^1.7 | Notificações toast |
| `vaul` | ^0.9 | Drawer (gaveta) para mobile |
| `embla-carousel-react` | ^8.6 | Carrossel de conteúdo |

### Formulários e Validação

| Tecnologia | Versão | Função |
|---|---|---|
| React Hook Form | ^7.61 | Gerenciamento de formulários |
| `@hookform/resolvers` | ^3.10 | Integração do React Hook Form com Zod |
| Zod | ^3.25 | Validação de schemas de formulários e API |

### Data Fetching e Estado

| Tecnologia | Versão | Função |
|---|---|---|
| TanStack Query (React Query) | ^5.83 | Cache, sincronização e gerenciamento de estado server-side |

### Datas

| Tecnologia | Versão | Função |
|---|---|---|
| `date-fns` | ^3.6 | Utilitários de manipulação de datas |
| `react-day-picker` | ^8.10 | Componente de seleção de datas (calendário) |

### Editor de Texto Rico

| Tecnologia | Versão | Função |
|---|---|---|
| Tiptap | ^3.15 | Editor de texto rico (ProseMirror-based) |

### Gráficos

| Tecnologia | Versão | Função |
|---|---|---|
| Recharts | ^2.15 | Gráficos e visualizações de dados |

### Exportação de Dados

| Tecnologia | Versão | Função |
|---|---|---|
| jsPDF | ^4.0 | Geração de arquivos PDF no browser |
| jspdf-autotable | ^5.0 | Tabelas em PDF via jsPDF |
| html2canvas | ^1.4 | Captura de elementos HTML como imagem |
| xlsx | ^0.18 | Leitura e escrita de planilhas Excel |

### Testes

| Tecnologia | Versão | Função |
|---|---|---|
| Vitest | ^3.2 | Framework de testes |
| `@testing-library/react` | ^16.0 | Testes de componentes React |
| `@testing-library/jest-dom` | ^6.6 | Matchers de DOM para testes |
| jsdom | ^20.0 | Simulação de DOM nos testes |

### Qualidade de Código

| Tecnologia | Versão | Função |
|---|---|---|
| ESLint | ^9.32 | Linting de código TypeScript/React |
| Prettier | ^3.8 | Formatação automática de código |
| Husky | ^9.1 | Git hooks para validação pré-commit |
| lint-staged | ^16.4 | Executa linting apenas nos arquivos alterados no commit |

### Build

| Tecnologia | Versão | Função |
|---|---|---|
| Turbopack | (embutido no Next.js 16) | Bundler incremental para desenvolvimento |
| Vite | ^5.4 | Bundler usado pelos testes (via Vitest) |
| `@vitejs/plugin-react-swc` | ^3.11 | Compilação rápida de React com SWC no Vite |
| PostCSS + Autoprefixer | — | Processamento CSS para Tailwind |

---

## Arquitetura de Segurança

```
Browser
  └── Cookie HttpOnly (authjs.session-token)  →  Next.js
                                                    ├── Auth.js (JWT)
                                                    └── API Route /api/proxy/*
                                                              ↓
                                                    X-Internal-Token (HMAC)
                                                              ↓
                                                         Fastify
                                                              ├── JWT (kreato_access_token)
                                                              └── PostgreSQL (Prisma)
```

---

## Padrões e Convenções

- **Monorepo** com dois `package.json` independentes
- **App Router** do Next.js 16 com Server Components e Client Components
- **Repository → Service → Routes** no backend por módulo
- **Injeção de dependência** via `buildApp(options?)` no backend (testes usam implementações in-memory)
- **Multi-tenancy** com isolamento por `tenantId` em todos os recursos
- **Paginação** padronizada: `{ data: T[], total: number }` com `?limit=` e `?offset=`
