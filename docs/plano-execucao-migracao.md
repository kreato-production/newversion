# Plano de Execucao da Migracao Tecnica

## Objetivo

Este plano transforma a analise tecnica em execucao pratica. O foco e:

- reduzir a dependencia do Supabase
- criar uma base tecnologica mais robusta
- preparar o produto para mercado
- organizar a implementacao em sprints objetivas

---

## Meta Estrategica

Ao final do ciclo de migracao, o projeto deve operar com:

- frontend desacoplado do fornecedor de banco
- backend proprio
- PostgreSQL local em desenvolvimento
- PostgreSQL self-hosted ou gerido em producao
- autenticacao centralizada
- autorizacao centralizada
- camada de dados tipada
- testes minimos dos fluxos criticos

---

## Premissas

- A migracao sera gradual
- O produto atual continuara operando enquanto a nova base e construida
- Nao sera feita uma reescrita total
- O Supabase sera encapsulado antes de ser removido
- O primeiro objetivo e criar independencia arquitetural, nao trocar tudo de uma vez

---

## Decisoes Tecnicas do Plano

### Stack alvo

- Frontend: React + TypeScript + React Query
- Backend: Node.js + Fastify + TypeScript
- ORM: Prisma
- Banco: PostgreSQL
- Auth: JWT + refresh token
- Arquivos: armazenamento local inicialmente, com possibilidade de migrar para MinIO ou S3 compativel

### Estrategia de migracao

1. estabilizar riscos criticos
2. criar camada de abstracao de dados
3. criar backend proprio
4. subir PostgreSQL local
5. migrar modulo piloto
6. migrar modulos centrais
7. desligar dependencias do Supabase

---

## Sprint Board

As sprints detalhadas deste plano estao nos arquivos:

- [SPRINT-01](/c:/Projetos/Kreato_Local/kreatoproduction/docs/sprints/SPRINT-01-estabilizacao-e-seguranca.md)
- [SPRINT-02](/c:/Projetos/Kreato_Local/kreatoproduction/docs/sprints/SPRINT-02-abstracao-de-dados-no-frontend.md)
- [SPRINT-03](/c:/Projetos/Kreato_Local/kreatoproduction/docs/sprints/SPRINT-03-backend-base-e-postgresql-local.md)
- [SPRINT-04](/c:/Projetos/Kreato_Local/kreatoproduction/docs/sprints/SPRINT-04-autenticacao-autorizacao-e-tenancy.md)
- [SPRINT-05](/c:/Projetos/Kreato_Local/kreatoproduction/docs/sprints/SPRINT-05-modulo-piloto-equipes-usuarios-unidades.md)
- [SPRINT-06](/c:/Projetos/Kreato_Local/kreatoproduction/docs/sprints/SPRINT-06-migracao-dos-modulos-centrais.md)
- [SPRINT-07](/c:/Projetos/Kreato_Local/kreatoproduction/docs/sprints/SPRINT-07-testes-observabilidade-e-hardening.md)

---

## Priorizacao Executiva

1. SPRINT-01
2. SPRINT-02
3. SPRINT-03
4. SPRINT-04
5. SPRINT-05
6. SPRINT-06
7. SPRINT-07

---

## Recomendacao de Cadencia

- Duracao de sprint: 2 semanas
- Revisao tecnica ao final de cada sprint
- Go or no-go para a sprint seguinte com base em criterio de aceite

---

## Regras de Execucao

- Nenhum modulo novo entra em migracao sem contrato definido
- Nenhuma regra critica continua no frontend se ja houver backend equivalente
- Nenhuma migracao e considerada concluida sem validacao funcional
- Nenhuma substituicao do Supabase ocorre sem plano de rollback
- Toda sprint deve terminar com testes criados para o escopo entregue
- Toda sprint deve terminar com execucao dos testes disponiveis
- O resultado da execucao dos testes deve ser registrado no fechamento da sprint
- Toda nova orientacao combinada deve ser registrada em [regras-operacionais-do-projeto.md](/c:/Projetos/Kreato_Local/kreatoproduction/docs/regras-operacionais-do-projeto.md)

---

## Encerramento

Este plano deve ser usado como referencia principal de execucao. A documentacao de analise continua sendo o insumo estrategico, enquanto este arquivo e os arquivos de sprint funcionam como guia tatico de implementacao.


