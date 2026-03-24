# SPRINT-02 Abstracao de Dados no Frontend

## Objetivo

Criar uma camada de abstracao para impedir que o frontend continue dependente diretamente do Supabase.

## Duracao sugerida

2 semanas

## Resultados esperados

- estrutura de modulos e servicos criada
- adaptadores de dados definidos
- contratos tipados por dominio
- inicio da substituicao do acesso direto ao Supabase

## Escopo

- criar camada `src/modules` ou `src/services`
- definir interfaces de repositorio
- criar clients e adaptadores
- preparar o frontend para consumir API propria no futuro

## Entregaveis

- estrutura de servicos por dominio
- interfaces de repositorio
- contrato comum de tratamento de erro
- refatoracao inicial de modulos piloto

## Tarefas

1. Definir estrutura alvo de modulos no frontend
2. Criar contratos para `auth`, `usuarios`, `unidades`, `equipes`
3. Encapsular chamadas ao Supabase em adaptadores
4. Substituir importacoes diretas do cliente onde for piloto
5. Padronizar tipagem de requests e responses
6. Revisar hooks genericos de dados

## Criterios de aceite

- modulos piloto nao dependem diretamente do cliente Supabase
- contratos tipados publicados
- fluxo de erro padronizado
- testes do escopo da sprint criados
- testes executados ao final da sprint

