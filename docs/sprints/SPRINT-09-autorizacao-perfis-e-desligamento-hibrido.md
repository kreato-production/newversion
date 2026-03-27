# SPRINT-09 Autorizacao, Perfis e Desligamento Hibrido

## Objetivo

Eliminar a dependencia hibrida residual deixada pela Sprint 8, migrando perfis, permissoes e contexto de autorizacao para o backend proprio e preparando o frontend para operar sem apoio do Supabase no fluxo central de acesso.

## Duracao sugerida

2 a 3 semanas

## Justificativa

A Sprint 8 removeu o principal gargalo da autenticacao, mas preservou dependencias legadas para manter compatibilidade com:

- perfil detalhado do usuario
- matriz de permissoes
- contexto de modulos habilitados do tenant

Enquanto isso permanecer fora do backend, o produto continua com governanca fragmentada e risco de divergencia entre frontend e backend. A Sprint 9 fecha exatamente esse buraco arquitetural.

## Resultados esperados

- backend como fonte oficial de autorizacao e perfil de acesso
- frontend carregando perfil, permissoes e modulos a partir da API propria
- reducao adicional das consultas diretas ao Supabase no bootstrap do app
- base pronta para desligar o modo hibrido de autenticacao e autorizacao
- caminho aberto para migrar modulos centrais seguintes com menos friccao

## Escopo

- dominio de perfis e permissoes no backend
- contexto de modulos habilitados por tenant no backend
- endpoint consolidado de bootstrap do usuario autenticado
- refatoracao de `usePermissions` para usar a API propria
- remocao do apoio legado de perfil no `AuthContext`
- plano de desligamento do hibrido de auth/permissoes

## Entregaveis

- contratos de perfil, permissao e modulos habilitados no backend
- endpoint de bootstrap autenticado contendo user context completo
- `AuthContext` operando sem carregar perfil do Supabase no fluxo principal
- `usePermissions` desacoplado da base legada
- documento de desligamento do modo hibrido
- evidencias de reducao de consultas diretas ao Supabase no bootstrap da aplicacao

## Tarefas

1. Mapear todas as dependencias residuais do fluxo de auth e permissao que ainda consultam Supabase.
2. Definir e implementar no backend o contrato oficial de contexto autenticado contendo:
   - usuario
   - tenant
   - perfil
   - permissoes
   - modulos habilitados
3. Criar repositorio e servico backend para perfis/permissoes.
4. Adaptar `/auth/me` ou criar endpoint dedicado de bootstrap autenticado com os dados completos de autorizacao.
5. Refatorar `AuthContext` para consumir exclusivamente o contexto autenticado vindo da API propria.
6. Refatorar `usePermissions` para depender do backend em vez de consultas diretas ao Supabase.
7. Medir e registrar quais consultas diretas ao Supabase deixaram de existir no bootstrap do app.
8. Definir procedimento de ativacao e rollback do desligamento do modo hibrido.
9. Criar e executar testes unitarios, testes de integracao e smoke tests do escopo entregue.

## Dependencias

- Sprint 8 concluida com sessao oficial via backend e fluxo principal de `gravacoes`
- Sprint 7 concluida com observabilidade e readiness
- Sprint 4 concluida com auth, roles e tenancy no backend

## Riscos principais

- regressao de permissao em modulos ja operacionais
- diferencas entre a matriz atual do frontend e a representacao nova no backend
- necessidade de migrar regras de visibilidade altamente especificas
- risco de quebra no bootstrap inicial do app se o contexto autenticado vier incompleto

## Mitigacoes

- manter ativacao controlada por configuracao durante a transicao
- criar testes de autorizacao para perfis criticos
- validar o bootstrap autenticado com smoke test completo
- registrar explicitamente gaps entre a matriz antiga e a nova antes do corte final

## Criterios de aceite

- perfil e permissoes carregados oficialmente a partir do backend
- `AuthContext` sem dependencia de perfil vindo do Supabase no fluxo principal
- `usePermissions` consumindo a API propria
- modulos habilitados do tenant vindos do backend
- reducao documentada de consultas diretas ao Supabase no bootstrap do app
- estrategia de rollback documentada
- testes do escopo da sprint criados
- testes executados ao final da sprint
- resultado da execucao registrado no encerramento da sprint

## Definicao de pronto

A Sprint 9 so sera considerada concluida quando:

- o frontend inicializar contexto autenticado completo a partir do backend
- as permissoes de UI dependerem da API propria
- os modulos habilitados do tenant vierem do backend
- o apoio hibrido de auth/permissoes puder ser desligado por configuracao com baixo risco

## Status atual

Em andamento em 25-03-2026.

## O que foi entregue ate agora

### 1. Contexto autenticado expandido no backend

O backend passou a montar contexto de autorizacao junto do usuario autenticado, incluindo:

- perfil
- tipo de acesso
- unidades do usuario
- modulos habilitados
- permissoes

A fonte desse contexto usa as tabelas legadas via consultas ao banco, mas a entrega oficial para o frontend agora sai do backend.

Arquivos principais:

- `backend/src/modules/auth/auth.types.ts`
- `backend/src/modules/auth/auth.repository.ts`
- `backend/src/modules/auth/auth.service.ts`

### 2. `/auth/me` fortalecido como bootstrap oficial

O endpoint autenticado passou a devolver contexto suficiente para o frontend montar sessao e autorizacao sem precisar consultar diretamente o Supabase no bootstrap de permissao.

### 3. `usePermissions` desacoplado do Supabase

O hook de permissao deixou de consultar diretamente:

- `profiles`
- `tenant_modulos`
- `perfis_acesso`
- `perfil_permissoes`

Agora ele depende do contexto autenticado carregado no usuario logado.

Arquivo principal:

- `src/hooks/usePermissions.ts`

### 4. Base documental de desligamento do modo hibrido

Foi criado o procedimento operacional para ativacao e rollback do corte de auth/autorizacao hibridos.

Documento:

- `docs/operacao/desligamento-modo-hibrido-auth-autorizacao.md`

## Reducao documentada de dependencias diretas ao Supabase

Consultas diretas removidas do bootstrap de permissao:

- busca de `tenant_modulos`
- busca de `perfis_acesso`
- busca de `perfil_permissoes`
- busca de `profiles` dentro do `usePermissions`

## Pendencias para fechar a sprint

- remover o apoio legado restante no carregamento detalhado de perfil do `AuthContext`
- validar telas administrativas que ainda manipulam perfis/permissoes por fluxo legado
- fechar o smoke test cobrindo bootstrap autenticado expandido com autorizacao
- registrar o encerramento final da sprint com status consolidado

## Validacoes executadas nesta etapa

### Backend

- `npm run test`: aprovado
- `npm run build`: aprovado

Resultado backend nesta etapa:

- 17 arquivos de teste aprovados
- 28 testes aprovados
- 0 falhas

### Frontend

- `npx tsc --noEmit`: aprovado
- `npm run test -- src/lib/api/http.test.ts src/modules/auth/auth.repository.test.ts src/modules/gravacoes/gravacoes.repository.test.ts src/modules/programas/programas.repository.test.ts`: aprovado

Resultado frontend nesta etapa:

- 4 arquivos de teste aprovados
- 11 testes aprovados
- 0 falhas

## Observacao estrategica

A Sprint 9 ja deslocou o eixo do bootstrap de autorizacao para o backend. O passo restante e encerrar o apoio legado que ainda existe no carregamento detalhado de perfil e nos fluxos administrativos de configuracao.
