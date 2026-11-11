# SPRINT-22 Administracao e Financeiro

## Objetivo

Migrar os cadastros administrativos, globais e financeiros, com atencao a seguranca e as modais compartilhadas.

Inventario e definicao de pronto: `docs/formularios-em-pagina-inventario.md`.

## Duracao sugerida

2 semanas

## Resultados esperados

- 9 telas migradas
- formulario de usuario reutilizavel entre Usuarios e Usuarios Globais

## Escopo

- Administracao: Perfis de Acesso, Unidades de Negocio, Centros de Lucro, Usuarios, Maestro
- Global: Usuarios Globais, Tenants
- Financeiro: Contas a Pagar, Orcamento (dialog inline na view)

## Entregaveis

- 9 telas migradas
- `UnidadeNegocioFormModal` mantida apenas para `TenantUnidadesTab`, sobre o mesmo componente de formulario

## Tarefas

1. Extrair o formulario de usuario para um componente unico e usa-lo em `/admin/usuarios` e `/global/usuarios`
2. Migrar `Perfil`, `UnidadeNegocio`, `CentroLucro`, `Tenant`
3. Migrar `Maestro`, mantendo o `ExecResultDialog` como modal (ja existe `GET /maestro/:id`)
4. Migrar `ContaPagar` e extrair o formulario inline de `views/financeiro/Orcamento.tsx` (ja existe `GET /orcamento/:id`)
5. Adicionar `GET /:id` em `admin-config`, `users`, `tenants`, `contas-pagar`, `unidades` e centros de lucro
6. Revisar testes de `users` e `tenants` (rotas restritas a GLOBAL_ADMIN)

## Criterios de aceite

- todas as telas do escopo abrem em `/novo` e `/[id]`, sem modal
- `GET /<recurso>/:id` com 404 (inexistente) e 403 (outro tenant) coberto por teste de rota
- navegacao anterior/proximo respeitando a ordem filtrada da lista
- edicao em somente leitura para quem nao tem permissao de alterar
- modais antigas removidas (ou mantidas apenas para os consumidores embutidos documentados)
- `tsc`, `lint` e testes de frontend e backend passando
- validacao manual de cada tela: incluir, alterar, consultar sem permissao, voltar e anterior/proximo
- testes do escopo da sprint criados
- testes executados ao final da sprint
