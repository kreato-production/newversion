# SPRINT-16 - Administracao, Permissoes e Formularios

## Objetivo

Migrar a camada administrativa que ainda segura o controle de campos, perfis e permissoes no Supabase.

## Duracao sugerida

2 semanas

## Contexto de entrada

- `Perfis de Acesso`, `Formularios` e `GlobalUsers` continuam no legado
- `permissionsMatrix.ts` e `useFormFieldConfig.tsx` ainda consultam Supabase diretamente

## Escopo

- `src/pages/admin/PerfisAcesso.tsx`
- `src/pages/admin/Formularios.tsx`
- `src/pages/admin/GlobalUsers.tsx`
- `src/data/permissionsMatrix.ts`
- `src/hooks/useFormFieldConfig.tsx`

## Entregaveis

- backend para perfis de acesso e permissoes
- backend para configuracao de formularios
- frontend administrativo usando apenas API propria
- fim do uso de `perfil_permissoes` e `formulario_campos` via cliente Supabase no frontend

## Tarefas

1. Criar modulos backend para perfis, permissoes e configuracao de formularios
2. Migrar `permissionsMatrix.ts` para service/repository local
3. Migrar `useFormFieldConfig.tsx` para backend
4. Migrar `PerfisAcesso.tsx` incluindo copiar perfil e exportar mapa
5. Migrar `Formularios.tsx` e `GlobalUsers.tsx`

## Criterios de aceitacao

- [ ] `PerfisAcesso` nao importa mais o cliente Supabase
- [ ] `Formularios` nao importa mais o cliente Supabase
- [ ] `GlobalUsers` nao importa mais o cliente Supabase
- [ ] `permissionsMatrix.ts` nao acessa mais `perfil_permissoes` pelo frontend
- [ ] `useFormFieldConfig.tsx` consulta apenas a API local

## Riscos

- impacto transversal em validacao de formularios
- permissao quebrada pode afetar varias telas ao mesmo tempo
