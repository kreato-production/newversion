# Stack Tecnologico Atual da Aplicacao

## Visao geral

Neste momento, a aplicacao Kreato esta organizada em duas camadas principais:

- frontend web em `React` com `TypeScript`
- backend API em `Fastify` com `TypeScript`

O projeto usa `PostgreSQL` como base de dados principal no ambiente local, `Prisma` como ORM, `Docker Compose` para subir o banco local, e `GitHub Actions` com deploy para `Azure Web App`.

## Frontend

### Base da aplicacao

- `React 18.3.1`
- `React DOM 18.3.1`
- `TypeScript 5.8.3`
- `Vite 5.4.19`
- `@vitejs/plugin-react-swc 3.11.0`

### Roteamento e estado de dados

- `react-router-dom 6.30.1` para roteamento
- `@tanstack/react-query 5.83.0` para cache e sincronizacao de dados

### Formularios e validacao

- `react-hook-form 7.61.1`
- `@hookform/resolvers 3.10.0`
- `zod 3.25.76`

### UI e design system

O frontend usa uma combinacao de componentes no estilo `shadcn/ui`, com forte apoio de `Radix UI` e utilitarios de classes CSS.

- `@radix-ui/*` para dialogos, dropdowns, tabs, tooltips, toasts, popovers, selects, accordions e outros primitives
- `class-variance-authority 0.7.1`
- `clsx 2.1.1`
- `tailwind-merge 2.6.0`
- `lucide-react 0.462.0` para iconografia
- `next-themes 0.3.0` para temas
- `vaul 0.9.9` para drawers
- `cmdk 1.1.1` para comandos e pesquisa
- `react-resizable-panels 2.1.9` para layouts redimensionaveis

### Estilo e CSS

- `Tailwind CSS 3.4.17`
- `PostCSS 8.5.6`
- `Autoprefixer 10.4.21`
- `tailwindcss-animate 1.0.7`
- `@tailwindcss/typography 0.5.16`

### Componentes e bibliotecas de apoio

- `date-fns 3.6.0` para datas
- `react-day-picker 8.10.1` para selecao de datas
- `embla-carousel-react 8.6.0` para carrosseis
- `recharts 2.15.4` para graficos
- `sonner 1.7.4` para notificacoes
- `input-otp 1.4.2` para campos OTP
- `html2canvas 1.4.1` para captura de tela
- `jspdf 4.0.0`
- `jspdf-autotable 5.0.7`
- `xlsx 0.18.5` para exportacao/importacao Excel

### Editor rich text

- `@tiptap/react 3.15.3`
- `@tiptap/starter-kit 3.15.3`
- `@tiptap/extension-color 3.15.3`
- `@tiptap/extension-text-style 3.15.3`

### Integracoes ainda presentes no frontend

- `@supabase/supabase-js 2.93.2`

Observacao:

- a dependencia de `Supabase` ainda existe no frontend e pode continuar a ser usada em partes legadas ou em transicao
- em paralelo, o projeto tambem possui backend proprio local em `Fastify + Prisma`

## Backend

### Base da API

- `Node.js` como runtime
- `Fastify 5.2.1`
- `TypeScript 5.8.2`
- `tsx 4.19.3` para desenvolvimento com watch

### Validacao e configuracao

- `zod 3.24.2` para validacao
- `dotenv 16.4.7` para variaveis de ambiente

### Seguranca e middleware

- `@fastify/cors 10.0.2`
- `@fastify/cookie 11.0.2`
- `@fastify/rate-limit 10.3.0`

### Persistencia e banco

- `Prisma 6.6.0`
- `@prisma/client 6.6.0`
- `PostgreSQL 16` no ambiente local via imagem Docker `postgres:16-alpine`

### Scripts principais do backend

- `npm run dev` para desenvolvimento com watch
- `npm run build` para compilacao TypeScript
- `npm run test` para testes
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:push`
- `npm run seed:local`

## Base de dados

### Banco local

No ambiente local, o banco esta configurado com:

- `PostgreSQL`
- base: `kreato_local`
- utilizador: `postgres`
- porta: `5432`
- schema principal: `public`

### Subida local do banco

O projeto usa `Docker Compose` para a instancia local do Postgres:

- imagem: `postgres:16-alpine`
- volume persistente: `postgres_data`
- healthcheck com `pg_isready`

## Testes e qualidade

### Frontend

- `Vitest 3.2.4`
- `@testing-library/react 16.0.0`
- `@testing-library/jest-dom 6.6.0`
- `jsdom 20.0.3`

### Backend

- `Vitest 3.0.8`

### Lint e padronizacao

- `ESLint 9.32.0`
- `@eslint/js 9.32.0`
- `typescript-eslint 8.38.0`
- `eslint-plugin-react-hooks 5.2.0`
- `eslint-plugin-react-refresh 0.4.20`

## CI/CD e infraestrutura

### Integracao continua

O workflow atual de CI/CD esta em:

- [main_kreato.yml](/C:/Projetos/Kreato_Local/kreatoproduction/.github/workflows/main_kreato.yml)

Tecnologias e servicos usados:

- `GitHub Actions`
- `actions/checkout@v4`
- `actions/setup-node@v3`
- `actions/upload-artifact@v4`
- `actions/download-artifact@v4`

### Deploy

O deploy automatizado atual esta configurado para:

- `Azure Web App`
- `azure/login@v2`
- `azure/webapps-deploy@v3`

Branch principal de deploy:

- `main`

Node configurado no workflow:

- `Node 20.x`

## Organizacao arquitetural atual

Em termos praticos, o stack atual pode ser resumido assim:

1. Frontend SPA em `React + TypeScript + Vite`
2. UI baseada em `Radix UI + Tailwind CSS + utilitarios shadcn-style`
3. Backend API em `Fastify + TypeScript`
4. Persistencia em `PostgreSQL + Prisma`
5. Ambiente local com `Docker Compose`
6. Testes com `Vitest` e `Testing Library`
7. CI/CD com `GitHub Actions`
8. Deploy em `Azure Web App`

## Observacoes importantes

- O sistema esta num momento de convivencia entre componentes novos do backend local e dependencias legadas do frontend, especialmente `Supabase`
- O stack principal recomendado para a evolucao do produto, pelo que existe hoje no repositorio, e `Fastify + Prisma + PostgreSQL` no backend e `React + Vite + TypeScript` no frontend
- O projeto ja esta preparado para desenvolvimento local completo com frontend, backend e Postgres

