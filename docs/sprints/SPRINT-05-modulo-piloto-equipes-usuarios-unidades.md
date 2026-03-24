# SPRINT-05 Modulo Piloto Equipes, Usuarios e Unidades

## Objetivo

Validar a nova arquitetura com um conjunto pequeno, importante e controlavel de modulos.

## Duracao sugerida

2 semanas

## Resultados esperados

- primeiro fluxo real operando fora do Supabase
- frontend consumindo API propria
- padrao de migracao validado

## Escopo

- migrar `usuarios`
- migrar `unidades de negocio`
- migrar `equipes`

## Entregaveis

- endpoints backend desses modulos
- repositorios frontend apontando para API propria
- UI desses modulos adaptada
- validacao funcional ponta a ponta

## Tarefas

1. Implementar CRUD de usuarios no backend
2. Implementar CRUD de unidades no backend
3. Implementar CRUD de equipes no backend
4. Criar DTOs e validacoes
5. Atualizar frontend dos modulos piloto
6. Remover dependencia direta do Supabase nesses modulos
7. Validar autorizacao por tenant e role

## Criterios de aceite

- tres modulos piloto operando sem chamadas diretas ao Supabase
- dados persistidos no PostgreSQL local
- frontend funcional com API propria
- testes do escopo da sprint criados
- testes executados ao final da sprint

