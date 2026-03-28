# SPRINT-15 - Conteudo e Gravacao Hibridos

## Objetivo

Fechar os fluxos que hoje parecem migrados, mas ainda executam partes criticas no Supabase.

## Duracao sugerida

2 semanas

## Contexto de entrada

- `GravacaoList` ja troca para backend no fluxo principal, mas o legado segue no arquivo
- `Conteudo` usa backend no CRUD basico, mas clonagem, geracao e recursos ainda tocam o Supabase

## Escopo

- `src/pages/producao/Conteudo.tsx`
- `src/components/producao/ConteudoFormModal.tsx`
- `src/pages/producao/GravacaoList.tsx`
- tabs relacionadas: `ConteudoRecursosTab`, `ConteudoCustosTab`, `ConteudoTerceirosTab`, `ElencoTab`, `ConvidadosTab`, `FigurinosTab`, `TerceirosTab`, `CustosTab`, `RoteiroTab`, `GravacaoIncidenciasTab`, `GravacaoTarefasTab`

## Entregaveis

- clone de conteudo via backend
- geracao de gravacoes via backend
- sincronizacao de recursos e terceiros via backend
- tabs de conteudo e gravacao sem acesso direto ao Supabase

## Tarefas

1. Criar endpoints de clone e geracao para `conteudos`
2. Migrar geracao de gravacoes e status inicial para o backend
3. Mover copia de `conteudo_recursos_*`, `conteudo_terceiros` e `gravacao_recursos`
4. Migrar tabs de elenco, convidados, figurinos, terceiros, custos e roteiro
5. Remover o legado Supabase de `GravacaoList.tsx` e deixar apenas a trilha backend

## Criterios de aceitacao

- [ ] `Conteudo` nao importa mais o cliente Supabase
- [ ] `ConteudoFormModal` nao importa mais o cliente Supabase
- [ ] `GravacaoList` nao mantem mais fallback operacional em Supabase
- [ ] tabs de conteudo e gravacao salvam e consultam apenas pelo backend

## Riscos

- modulo com mais volume de regras de negocio
- forte dependencia entre tabs e geracao automatica
