# SPRINT-18 Fundacao dos formularios em pagina

## Objetivo

Transformar o piloto de Pessoas num padrao reutilizavel, para que cada tela seguinte seja migrada so com configuracao e campos.

Inventario e definicao de pronto: `docs/formularios-em-pagina-inventario.md`.

## Duracao sugerida

1 semana

## Resultados esperados

- componente de layout reutilizavel para formularios em pagina
- hook reutilizavel de navegacao entre registros
- Pessoas refatorado sobre a base nova
- padrao documentado no CLAUDE.md

## Escopo

- extrair de `PessoaForm.tsx` um componente `FormPage` (`src/components/shared/FormPage.tsx`) com `PageHeader`, barra de acoes (Voltar, anterior/proximo, Cancelar, Salvar), estado de carregamento e erro "registro nao encontrado"
- extrair o hook `useRecordNavigation(storageKey, basePath)`, que grava e le a ordem filtrada da lista no sessionStorage
- criar helpers para abrir a pagina a partir da lista (`openRecord`, `openNew`)
- definir o padrao de backend `getById` + rota `GET /:id` (modelo: `backend/src/modules/pessoas`)
- refatorar Pessoas para usar `FormPage` e `useRecordNavigation`

## Entregaveis

- `FormPage`, `useRecordNavigation` e helpers criados e testados
- Pessoas funcionando como antes, usando a base nova
- padrao descrito no `CLAUDE.md` (secao Frontend architecture)

## Tarefas

1. Criar `src/components/shared/FormPage.tsx`
2. Criar `src/hooks/useRecordNavigation.ts`
3. Refatorar `src/views/recursos/PessoaForm.tsx` e `Pessoas.tsx`
4. Escrever testes de `FormPage` (somente leitura, carregando, erro, submit) e do hook
5. Documentar o padrao no `CLAUDE.md` e corrigir a secao do frontend (Next.js na porta 3001)

## Criterios de aceite

- base reutilizavel pronta e coberta por testes
- Pessoas sem regressao (incluir, alterar, consultar, anterior/proximo)
- `tsc`, `lint` e testes de frontend e backend passando
- testes do escopo da sprint criados
- testes executados ao final da sprint
