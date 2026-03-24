# SPRINT-04 Autenticacao, Autorizacao e Tenancy

## Objetivo

Mover os pilares de acesso e seguranca para o backend proprio.

## Duracao sugerida

2 semanas

## Resultados esperados

- autenticacao centralizada no backend
- autorizacao baseada em roles e tenant
- tenant context definido
- sessao pronta para uso no frontend

## Escopo

- criar modulo de autenticacao
- implementar login
- implementar refresh token
- implementar validacao de tenant
- implementar roles e guards

## Entregaveis

- endpoints de login e refresh
- middleware de autenticacao
- middleware de tenant context
- middleware de autorizacao
- tabela ou estrategia de identidade definida

## Tarefas

1. Modelar usuarios e credenciais no backend
2. Implementar hash de senha
3. Implementar emissao de JWT
4. Implementar refresh token
5. Criar tenant guard
6. Criar role guard
7. Mover regra de validacao de licenca para backend

## Criterios de aceite

- autenticacao funcionando ponta a ponta
- tenant resolvido no backend
- autorizacao sem dependencia do frontend
- login basico utilizavel pelo frontend
- testes do escopo da sprint criados
- testes executados ao final da sprint

