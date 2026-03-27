# Regras Operacionais do Projeto

## Objetivo

Este documento registra as regras permanentes, decisoes operacionais e orientacoes de execucao combinadas durante a evolucao do projeto.

Ele deve ser atualizado sempre que uma nova regra importante for definida.

---

## Regras Atuais

### 1. Cada sprint deve terminar com testes

Ao final de cada sprint, e obrigatorio:

- criar os testes relevantes para o que foi implementado
- executar os testes
- registrar no encerramento da sprint o resultado da execucao
- informar claramente se algum teste nao pode ser executado e por qual motivo

### 2. Toda regra nova deve ser documentada

Sempre que uma nova orientacao estrutural, tecnica ou operacional for definida, ela deve ser adicionada neste documento.

### 3. O frontend nao deve continuar crescendo com dependencia direta do Supabase

Nenhuma nova implementacao relevante deve reforcar o acoplamento direto ao Supabase.

### 4. Regras criticas devem migrar para o backend

Autenticacao, autorizacao, tenancy, licenciamento e operacoes administrativas sensiveis devem ficar no backend proprio.

### 5. Toda sprint deve deixar evidencias

Ao final de cada sprint deve existir, quando aplicavel:

- codigo implementado
- documentacao atualizada
- testes criados
- testes executados
- status de validacao registrado

### 6. Se uma validacao nao puder ser executada, isso deve ser explicitado

Nao e aceitavel encerrar uma etapa sem informar o que foi validado e o que ficou pendente.

### 7. O documento deve continuar vivo

Este arquivo e a memoria operacional do projeto. Ele deve ser tratado como referencia para futuras implementacoes.

### 8. O backend proprio passa a ser a fundacao oficial da nova arquitetura

A evolucao da aplicacao deve seguir a stack propria definida no projeto:

- backend em `backend/`
- API em Fastify
- ORM Prisma
- PostgreSQL como base local e base alvo da operacao

### 9. Dependencias novas de backend devem ser validadas com build, testes e Prisma

Sempre que houver evolucao relevante no backend, deve-se validar, quando aplicavel:

- `npm run test`
- `npm run build`
- `npm run prisma:generate`

### 10. A autenticacao oficial do produto deve ser emitida e validada no backend

A origem oficial de sessao, access token, refresh token, roles e tenant context passa a ser o backend proprio.

### 11. Migracoes do frontend para o backend proprio devem entrar por camada HTTP dedicada e ativacao controlada

A troca de fornecedor de dados no frontend deve ser feita de forma progressiva, com cliente HTTP proprio e ativacao controlada por configuracao, evitando quebra brusca da operacao atual.

### 12. Modulos centrais devem ser migrados por prioridade de impacto e isolamento tecnico

Na migracao dos modulos centrais, devemos priorizar primeiro os modulos com alto valor de negocio e baixo acoplamento relativo, usando cada modulo migrado como trampolim para o seguinte.

### 13. Releases do backend devem manter observabilidade minima e prontidao operacional

Nao devemos considerar uma release minimamente pronta sem:

- `GET /health` e `GET /ready`
- logs estruturados por requisicao
- `correlationId` nas respostas de erro tratadas
- smoke tests dos fluxos criticos
- documentacao de deploy, backup, restore e rollback atualizada

### 14. Migracoes de sessao e modulos centrais podem entrar em modo hibrido, mas o ponto oficial precisa estar definido

Quando uma migracao ainda exigir convivencia com partes legadas:

- o fluxo oficial novo deve estar claramente definido
- a ativacao deve ser controlada por configuracao
- as dependencias legadas remanescentes devem ser registradas no encerramento da sprint
- o rollback deve ser simples e documentado

---

## Como usar este documento

- consultar antes de iniciar uma nova sprint
- atualizar ao definir novas regras
- usar como base de alinhamento tecnico e operacional

---

## Regras a serem adicionadas no futuro

Esta secao deve receber novas decisoes conforme forem surgindo, por exemplo:

- politica de cobertura de testes
- estrategia de branching
- padrao de release
- checklist de deploy
- padrao de logs e observabilidade
