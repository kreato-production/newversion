# Analise Tecnica e Plano de Evolucao para Produto

## Objetivo

Este documento consolida a analise tecnica do projeto `Kreato Production`, identifica o que esta bem, o que precisa melhorar, o que precisa ser reestruturado e apresenta um plano para reduzir a dependencia do Supabase, adotando uma base de dados local ou self-hosted.

O objetivo final e transformar o projeto num produto de mercado com maior robustez tecnica, seguranca, previsibilidade operacional e independencia de fornecedor.

---

## 1. Resumo Executivo

O projeto ja possui um valor funcional importante. O dominio esta relativamente bem mapeado, cobrindo areas como:

- Producao
- Gravacoes
- Conteudos
- Recursos humanos, tecnicos e fisicos
- Fornecedores
- Administracao
- Multi-tenant
- Perfis e permissoes

Em termos de produto, isso e um ativo forte. Em termos de engenharia, o sistema ainda se encontra mais proximo de um MVP avancado ou plataforma em consolidacao do que de um produto pronto para escalar com seguranca e eficiencia.

O maior problema atual nao e falta de funcionalidade. O maior problema e que o crescimento funcional foi mais rapido do que a consolidacao da arquitetura.

Hoje, os principais riscos tecnicos sao:

- Forte acoplamento ao Supabase
- Regras criticas executadas no frontend
- Baixa cobertura de testes
- Componentes e paginas grandes demais
- Uso elevado de `any`
- Documentacao operacional insuficiente
- Dependencia excessiva de configuracoes e contratos informais

Conclusao objetiva:

- O projeto tem potencial real de produto
- A stack base e boa
- A arquitetura precisa amadurecer antes de uma comercializacao mais agressiva

---

## 2. O Que Esta Bem

### 2.1 Stack moderna e adequada

O projeto usa uma stack moderna e produtiva:

- React
- TypeScript
- Vite
- Tailwind
- React Query
- Supabase

Essa combinacao e boa para rapidez de entrega e boa experiencia de desenvolvimento.

### 2.2 Dominio de negocio bem avancado

O sistema cobre muitas areas operacionais de um ambiente de producao audiovisual. Isso indica que houve bom entendimento do negocio e bastante traducao de necessidade real em software.

### 2.3 Estrutura visual consistente

O uso de `shadcn/ui`, componentes compartilhados e padroes visuais reutilizaveis ajuda bastante na consistencia da interface.

### 2.4 Multi-tenancy e controle de acesso ja foram considerados

O projeto nao ignora temas importantes de produto B2B. Pelo contrario, ja existem:

- tenants
- licencas
- modulos habilitados por tenant
- perfis de acesso
- politicas RLS
- relacoes de usuario por unidade

Isso e um diferencial positivo, porque muitos projetos so tratam isso tarde demais.

### 2.5 Existe uma base de dados rica

As migrations mostram um esforco relevante de modelagem. A estrutura do banco nao e improvisada. Existe bastante material reaproveitavel mesmo se o Supabase deixar de ser usado como plataforma.

---

## 3. O Que Precisa Melhorar

### 3.1 Qualidade e seguranca de evolucao

O projeto praticamente nao possui testes significativos. Hoje isso gera tres problemas:

- mudancas ficam arriscadas
- correcoes podem gerar regressoes silenciosas
- o custo de manutencao aumenta rapidamente

Sem cobertura minima dos fluxos criticos, a escalabilidade tecnica fica comprometida.

### 3.2 Tipagem e contratos

Ha uso relevante de `any`, especialmente na camada de acesso a dados e em modulos complexos. Isso reduz confiabilidade e enfraquece o beneficio principal do TypeScript.

### 3.3 Organizacao por dominio

O projeto esta muito organizado por paginas, componentes e hooks, mas ainda pouco organizado por dominios de negocio.

Hoje o codigo esta mais proximo de:

- paginas grandes
- hooks genericos
- regras espalhadas

Do que de algo como:

- modulo de autenticacao
- modulo de usuarios
- modulo de producao
- modulo de recursos
- modulo de tenancy

### 3.4 Maturidade operacional

Ainda faltam itens essenciais para produto:

- documentacao tecnica de arquitetura
- documentacao de deploy
- documentacao de backup e restore
- observabilidade
- padrao de logs
- monitoramento de erros
- plano de rollback

### 3.5 Performance e carregamento

Com o volume atual de modulos, o sistema ja deveria caminhar para:

- lazy loading por rota
- divisao de bundles
- extracao de componentes pesados
- consolidacao de queries e cache

---

## 4. O Que Precisa Ser Reestruturado

### 4.1 Camada de dados

Hoje o frontend conversa diretamente com o Supabase em muitos pontos. Isso gera:

- acoplamento forte ao fornecedor
- dispersao da logica de dados
- dificuldade para trocar infraestrutura
- dificuldade para testar

Essa camada deve ser reestruturada para um modelo de abstracao.

### 4.2 Regras de negocio sensiveis

Regras como:

- validacao de licenca
- bloqueio de tenant
- autorizacao administrativa
- criacao de usuarios
- verificacao de modulos habilitados

nao deveriam depender principalmente do frontend.

Elas precisam morar numa camada controlada no backend.

### 4.3 Componentes gigantes

Alguns arquivos concentram responsabilidades demais:

- UI
- busca de dados
- transformacao
- calculo
- exportacao
- filtros
- regras de permissao

Isso torna o sistema caro de manter e dificil de estabilizar.

### 4.4 I18n e permissoes

Os arquivos de traducao e matriz de permissao estao grandes e centralizados demais. Isso pode funcionar por um tempo, mas nao escala bem para:

- novos modulos
- multiplos desenvolvedores
- evolucao de produto

### 4.5 Documentacao e padronizacao do projeto

O projeto ainda carrega sinais de template e configuracao inicial, o que enfraquece a apresentacao tecnica e operacional para um produto serio.

---

## 5. Principais Riscos Tecnicos Atuais

### 5.1 Dependencia excessiva do Supabase

O acoplamento esta em muitos pontos do frontend e tambem em:

- autenticacao
- edge functions
- politicas RLS
- estrutura de tipos
- cliente compartilhado

Na pratica, isso significa que trocar o Supabase hoje nao e um ajuste pequeno. E uma migracao arquitetural.

### 5.2 Regras criticas no cliente

Quando o frontend decide parte importante do comportamento de acesso, o sistema fica:

- menos auditavel
- mais fragil
- mais dificil de proteger
- mais dificil de integrar com outros canais

### 5.3 Ausencia de camada backend propria

Hoje o Supabase funciona como:

- banco
- autenticacao
- camada de autorizacao
- backend parcial

Isso acelera MVP, mas limita independencia tecnologica.

### 5.4 Testes insuficientes

Sem testes de regressao, cada refatoracao grande se torna mais cara e mais perigosa.

### 5.5 Falhas de seguranca e operacao

Foi identificado risco claro no bootstrap do admin global e no tratamento de credenciais. Isso precisa ser corrigido antes de qualquer posicionamento mais serio de mercado.

---

## 6. Avaliacao de Prontidao para Produto

### Estado atual

O projeto esta pronto para:

- validacao interna
- piloto controlado
- evolucao funcional

O projeto ainda nao esta maduro o suficiente para:

- escalar clientes com confianca alta
- operar com processo tecnico robusto
- sustentar crescimento sem aumento forte de complexidade

### Diagnostico sintetico

Classificacao atual recomendada:

- Produto funcional: sim
- Produto de mercado pronto para escalar: ainda nao

---

## 7. Direcao Recomendada: Sair da Dependencia do Supabase

## 7.1 O que significa "nao depender do Supabase"

Ha tres niveis possiveis:

### Nivel 1: manter o Supabase apenas localmente ou self-hosted

Voce continua usando o stack Supabase, mas em infraestrutura propria.

Vantagens:

- menor esforco de migracao
- reaproveitamento de migrations
- reaproveitamento de parte da modelagem
- menor impacto no frontend no curto prazo

Desvantagens:

- continua dependente do ecossistema Supabase
- ainda existe acoplamento da aplicacao aos contratos do Supabase

### Nivel 2: manter PostgreSQL e remover Supabase como plataforma

Voce migra para:

- PostgreSQL local ou self-hosted
- backend proprio
- autenticacao propria
- autorizacao propria

Vantagens:

- independencia real de fornecedor
- controle total sobre arquitetura
- melhor governanca e observabilidade

Desvantagens:

- custo tecnico de migracao maior
- maior responsabilidade operacional

### Nivel 3: banco local embarcado

Exemplo:

- SQLite

Essa opcao so faria sentido se o produto fosse single-tenant local, desktop-first ou offline-first.

Para este projeto, com multi-tenant, permissoes, usuarios e operacao colaborativa, SQLite nao e a melhor direcao como base principal de produto.

### Recomendacao

A recomendacao mais equilibrada e:

- usar PostgreSQL como banco padrao
- rodar localmente para desenvolvimento
- usar backend proprio
- reduzir o Supabase gradualmente ate sua retirada completa

---

## 8. Recomendacao de Base de Dados Local

## 8.1 Melhor opcao: PostgreSQL local

Recomendo fortemente PostgreSQL local para desenvolvimento e PostgreSQL self-hosted para producao.

Motivos:

- o modelo atual ja esta essencialmente desenhado para Postgres
- as migrations existentes podem ser reaproveitadas em boa parte
- suporta multi-tenant com seguranca
- suporta volume e concorrencia melhores
- facilita migracao gradual
- e mais adequado para ERP/SaaS do que SQLite

### Estrutura recomendada

- Banco local para dev: PostgreSQL via Docker
- Banco de homologacao: PostgreSQL dedicado
- Banco de producao: PostgreSQL gerido ou self-hosted

---

## 9. Arquitetura Recomendada Sem Supabase

## 9.1 Nova arquitetura alvo

### Frontend

- React
- TypeScript
- React Query
- camada de API propria

### Backend

Sugestao:

- Node.js
- Fastify ou NestJS
- TypeScript
- Prisma ou Drizzle ORM

### Banco

- PostgreSQL

### Autenticacao

Sugestao:

- JWT com refresh token
- sessao server-side ou token rotation
- controle de roles e permissoes no backend

### Armazenamento de arquivos

Opcoes:

- disco local no inicio
- MinIO
- S3 compativel

### Observabilidade

- logs estruturados
- monitoramento de erros
- auditoria de acoes sensiveis

---

## 10. Plano de Migracao para Banco Local e Saida do Supabase

## Fase 1: Estabilizacao

Objetivo:

- reduzir risco antes da migracao

Acoes:

- corrigir falhas de seguranca
- documentar entidades principais
- mapear todos os pontos de acoplamento com Supabase
- congelar mudancas estruturais grandes durante o desenho da migracao

## Fase 2: Criar camada de abstracao de dados

Objetivo:

- impedir que o frontend continue conhecendo o fornecedor diretamente

Acoes:

- criar `src/services` ou `src/modules/*/services`
- encapsular acesso a dados por dominio
- substituir importacoes diretas do cliente do Supabase por adaptadores
- criar interfaces de repositorio

Exemplo conceitual:

- `AuthRepository`
- `UsersRepository`
- `TenantsRepository`
- `ProducoesRepository`
- `RecursosRepository`

Essa fase e obrigatoria mesmo que a troca de banco nao aconteca imediatamente.

## Fase 3: Criar backend proprio

Objetivo:

- mover regras criticas para uma camada controlada

Acoes:

- criar API backend
- implementar autenticacao
- implementar autorizacao
- mover validacao de licenca
- mover criacao/edicao de usuarios
- mover regras administrativas

## Fase 4: Migrar schema para PostgreSQL puro

Objetivo:

- tornar o banco independente da plataforma

Acoes:

- adaptar migrations atuais
- remover dependencias exclusivas do Supabase
- substituir `auth.users` por tabela ou estrategia propria de identidade
- reimplementar funcoes e politicas necessarias no novo contexto

## Fase 5: Migrar frontend para API propria

Objetivo:

- retirar chamadas diretas ao Supabase

Acoes:

- trocar `supabase.from(...)` por chamadas HTTP
- centralizar tratamento de erro
- padronizar DTOs
- manter cache no React Query

## Fase 6: Desativar Supabase

Objetivo:

- encerrar dependencia operacional

Acoes:

- migrar usuarios
- migrar dados
- migrar arquivos
- validar logs
- validar rotinas de backup
- desligar integracoes restantes

---

## 11. Decisoes Tecnicas Recomendadas

## 11.1 ORM

### Opcao recomendada: Prisma

Vantagens:

- produtividade alta
- tipagem boa
- ecossistema maduro
- onboarding mais simples

### Alternativa: Drizzle

Boa opcao se a prioridade for:

- maior proximidade com SQL
- melhor controle fino
- stack mais enxuta

## 11.2 Backend framework

### Opcao recomendada: Fastify

Vantagens:

- leve
- rapido
- simples
- excelente para APIs de negocio

### Alternativa: NestJS

Boa opcao se quiser:

- estrutura corporativa mais opinativa
- DI formal
- modulos padronizados

## 11.3 Autenticacao

Recomendado:

- tabela propria de usuarios
- senha com hash seguro
- JWT curto + refresh token
- auditoria de login
- invalidacao de sessao

## 11.4 Multi-tenancy

Recomendado:

- manter `tenant_id` nas tabelas de negocio
- aplicar isolamento no backend
- usar filtros e guards centrais
- manter auditoria por tenant

---

## 12. O Que Nao Recomendo

- Manter o frontend acessando banco diretamente no medio prazo
- Trocar Supabase por SQLite como banco principal do produto
- Refatorar tudo de uma vez
- Migrar infraestrutura antes de criar camada de abstracao
- Continuar adicionando funcionalidade grande sem corrigir a base arquitetural

---

## 13. Roadmap Recomendado de 90 Dias

## Primeiros 30 dias

- corrigir falhas criticas de seguranca
- criar documentacao de arquitetura
- mapear dependencias do Supabase
- criar camada de servicos por dominio no frontend
- iniciar testes dos fluxos criticos

## 30 a 60 dias

- subir backend proprio
- implementar autenticacao e autorizacao centrais
- migrar modulos criticos para API propria
- modularizar componentes grandes
- estruturar logs e auditoria

## 60 a 90 dias

- subir PostgreSQL local e ambiente de homologacao
- migrar dados e rotinas principais
- retirar chamadas diretas ao Supabase
- estabilizar CI/CD
- preparar deploy de produto

---

## 14. Prioridades Absolutas

Se a execucao precisar ser focada, a ordem recomendada e:

1. Corrigir seguranca e credenciais sensiveis
2. Criar camada de abstracao de dados
3. Implementar backend proprio
4. Migrar para PostgreSQL local/self-hosted
5. Criar testes de fluxos criticos
6. Modularizar os pontos mais complexos

---

## 15. Conclusao Final

O projeto tem base funcional forte e potencial real de mercado. O que falta nao e mais tela ou mais cadastro. O que falta e consolidacao tecnica.

Para transformar o sistema num produto de mercado, a direcao recomendada e:

- sair do modelo de frontend fortemente acoplado ao Supabase
- adotar backend proprio
- usar PostgreSQL como banco local e base principal da arquitetura
- profissionalizar seguranca, testes, observabilidade e documentacao

Em resumo:

- Sim, faz sentido tratar a saida da dependencia do Supabase
- Sim, faz sentido adotar uma base de dados local
- A melhor escolha para isso e PostgreSQL local/self-hosted, e nao SQLite como banco principal
- A migracao deve ser feita por fases, com abstracao antes da troca

---

## 16. Proximo Passo Recomendado

O proximo passo mais pragmatico e criar a nova fundacao tecnica em paralelo ao sistema atual:

- definir backend
- definir ORM
- subir PostgreSQL local
- modelar modulo de autenticacao
- migrar primeiro um modulo de negocio piloto

Modulos bons para piloto:

- usuarios
- unidades de negocio
- equipes

Esses modulos sao menores, relevantes e ajudam a validar a nova arquitetura com risco mais controlado.
