# Plano de Desligamento do Supabase

## Contexto

O sistema foi originado na plataforma Lovable com Supabase como backend-as-a-service. As sprints 10–12 implementaram um backend próprio em Fastify + PostgreSQL. O Supabase deve ser removido completamente quando todos os módulos tiverem sido migrados.

## Critério de Ativação

O desligamento pode ser executado quando **100% das páginas e módulos** estiverem usando o backend próprio (`VITE_DATA_PROVIDER=backend` e `VITE_AUTH_PROVIDER=backend`) com testes passando.

## Inventário de Arquivos com Referências ao Supabase

### Camada de Integração (remover por completo)

| Arquivo | Tipo | Sprint alvo |
|---|---|---|
| `src/integrations/supabase/client.ts` | Cliente Supabase | SPRINT-13 |
| `src/integrations/supabase/types.ts` | Tipos gerados | SPRINT-13 |
| `src/hooks/useSupabaseData.ts` | Hook de dados | SPRINT-14 |

### Auth (migrado parcialmente — Sprint 10)

| Arquivo | Status | Ação |
|---|---|---|
| `src/modules/auth/auth.repository.ts` | Híbrido (Supabase + Backend) | Remover `SupabaseAuthRepository` e `isBackendAuthProviderEnabled` |
| `src/contexts/AuthContext.tsx` | Usa `authRepository` | Simplificar após remoção do Supabase |

### Módulos migrados para o backend próprio

| Módulo | Arquivo Supabase | Arquivo Backend | Status |
|---|---|---|---|
| Equipes | `equipes.repository.ts` (Supabase) | ✅ Backend | Remover código Supabase |
| Gravações | `gravacoes/gravacoes.repository.ts` | ✅ Backend | Remover código Supabase |
| Programas | `programas/programas.repository.ts` | ✅ Backend | Remover código Supabase |
| Unidades | `unidades.repository.ts` | ✅ Backend | Remover código Supabase |
| Usuários | `usuarios/` | ✅ Backend | Remover código Supabase |

### Módulos ainda não migrados (páginas Supabase-only)

Estes módulos dependem exclusivamente do Supabase e precisam ser migrados antes do desligamento:

**Produção:**
- `src/pages/producao/Conteudo.tsx` + `ConteudoFormModal.tsx`
- `src/pages/producao/Tarefas.tsx` + `TarefaFormModal.tsx`
- `src/pages/producao/StatusGravacao.tsx`, `StatusTarefa.tsx`
- `src/pages/producao/CategoriasIncidencia.tsx`, `ImpactosIncidencia.tsx`, `SeveridadesIncidencia.tsx`
- `src/pages/producao/IncidenciasGravacao.tsx`
- `src/pages/producao/TabelasPreco.tsx`
- `src/pages/producao/Mapas.tsx`

**Recursos:**
- `src/pages/recursos/RecursosHumanos.tsx`, `RecursosFisicos.tsx`, `RecursosTecnicos.tsx`
- `src/pages/recursos/Pessoas.tsx`, `Figurinos.tsx`, `Fornecedores.tsx`, `Departamentos.tsx`

**Admin:**
- `src/pages/admin/CentrosLucro.tsx`, `PerfisAcesso.tsx`
- `src/components/admin/UsuarioFormModal.tsx` (parcial)

**Shared:**
- `src/hooks/useGravacaoReportData.ts`
- `src/hooks/useRecursoFisicoDisponibilidade.ts`
- `src/hooks/useFormFieldConfig.tsx`
- `src/data/permissionsMatrix.ts`
- `src/components/shared/ParametroListPage.tsx`

## Passos de Remoção (quando critério atingido)

### 1. Remover feature flags (simplificação)
```
src/lib/api/http.ts          — remover isBackendAuthProviderEnabled, isBackendDataProviderEnabled
src/modules/auth/auth.repository.ts — remover SupabaseAuthRepository, manter só BackendAuthRepository
```

### 2. Remover integração Supabase
```
rm -rf src/integrations/supabase/
```

### 3. Remover dependência do package.json
```sh
npm uninstall @supabase/supabase-js
```

### 4. Remover variáveis de ambiente
```
.env  — remover VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### 5. Limpar AuthContext
- Remover `supabaseUser`, `session` do contexto (tornam-se desnecessários)
- Simplificar para usar apenas `BackendAuthRepository`

### 6. Limpar AuthTypes
```
src/modules/auth/auth.types.ts — remover AuthSession, AuthSessionUser (substituir por tipos do backend)
```

## Variáveis de Ambiente a Remover

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_AUTH_PROVIDER=...       (padrão passará a ser backend sempre)
VITE_DATA_PROVIDER=...       (idem)
```

## Estimativa de Esforço

| Sprint | Módulos alvo | Esforço estimado |
|---|---|---|
| SPRINT-13 | RecursosHumanos, RecursosFisicos, RecursosTecnicos | 2 semanas |
| SPRINT-14 | Conteudo, Tarefas, TabelasPreco, StatusGravacao | 2 semanas |
| SPRINT-15 | Mapas, Incidencias, CategoriasIncidencia, Admin restante | 2 semanas |
| SPRINT-16 | Remoção completa do Supabase + limpeza | 1 semana |

**Sprint alvo para desligamento completo: SPRINT-16**

## Validação pós-desligamento

- [ ] `npm run build` sem erros de import Supabase
- [ ] `npm test` mantém todos os testes verdes
- [ ] Nenhum `@supabase` em `package.json`
- [ ] Nenhum `VITE_SUPABASE_*` em `.env`
- [ ] Login/logout funcionando 100% via cookies httpOnly
- [ ] Todas as páginas listadas acima funcionando via backend próprio
