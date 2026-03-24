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
