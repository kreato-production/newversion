# Kreato Production — Guia de Instalação

## Pré-requisitos

| Componente | Versão mínima | Download                   |
| ---------- | ------------- | -------------------------- |
| Node.js    | 18+           | https://nodejs.org         |
| npm        | 9+            | (incluído com Node.js)     |
| PostgreSQL | 14+           | https://www.postgresql.org |

> O PostgreSQL deve estar em execução e acessível antes de iniciar a instalação.
> O banco de dados será criado automaticamente se não existir (o utilizador PostgreSQL deve ter permissão `CREATEDB`).

---

## Instalação

### Linux / macOS

```bash
chmod +x install.sh
./install.sh
```

### Windows

**Opção A — Batch (duplo clique):**

```
install.bat
```

**Opção B — PowerShell:**

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

---

## O que o instalador faz

1. Verifica Node.js 18+
2. Pergunta o modo: **produção** ou **desenvolvimento**
3. Coleta as configurações do PostgreSQL (host, porta, banco, usuário, senha)
4. Coleta as portas e URLs públicas da aplicação
5. Gera automaticamente todos os secrets de segurança (JWT, Auth.js, sessão)
6. Cria os ficheiros de ambiente (`backend/.env` e `.env.local`)
7. Instala todas as dependências (`npm install`)
8. Aplica o schema ao banco de dados (`prisma db push`)
9. Cria o utilizador administrador global
10. Em modo **produção**: compila a aplicação e inicia com **pm2**
11. Gera os scripts `start.sh`/`start.bat` e `stop.sh`/`stop.bat`

---

## Credenciais padrão

| Campo      | Valor          |
| ---------- | -------------- |
| Utilizador | `Admin_Global` |
| Senha      | `Admin@123`    |

> **Recomendado:** altere a senha após o primeiro login.

---

## Gestão de serviços (após instalação)

### Com pm2 (modo produção)

```bash
pm2 status              # Estado dos serviços
pm2 logs                # Logs em tempo real
pm2 logs kreato-backend # Logs só do backend
pm2 restart all         # Reiniciar todos
pm2 stop all            # Parar todos
pm2 start ecosystem.config.cjs  # Iniciar
```

### Com scripts

| Plataforma  | Iniciar                      | Parar                      |
| ----------- | ---------------------------- | -------------------------- |
| Linux/macOS | `bash start.sh`              | `bash stop.sh`             |
| Windows     | `start.bat` ou `.\start.ps1` | `stop.bat` ou `.\stop.ps1` |

---

## Auto-start no boot (produção)

### Linux/macOS

```bash
pm2 startup    # Gera o comando — execute o comando gerado com sudo
pm2 save       # Salva a lista de processos atual
```

### Windows

```powershell
npm install -g pm2-startup
pm2-startup install
pm2 save
```

Ou use o Agendador de Tarefas do Windows para executar `start.bat` na inicialização.

---

## Estrutura de ficheiros gerados pelo instalador

```
backend/.env              ← Configuração do backend (secrets, DB, etc.)
.env.local                ← Configuração do frontend (Next.js)
ecosystem.config.cjs      ← Configuração pm2 (modo produção)
start.sh / start.bat      ← Scripts de início
stop.sh / stop.bat        ← Scripts de paragem
start.ps1 / stop.ps1      ← Scripts PowerShell (Windows)
.logs/                    ← Logs dos serviços
```

---

## Reinstalação / Atualização

Para reinstalar ou atualizar, execute o instalador novamente. Os ficheiros `.env` e `.env.local` **serão sobrescritos** com novos secrets — guarde uma cópia antes se necessário.

Para preservar os dados existentes, o instalador usa `prisma db push` (não `--force-reset`), que aplica apenas as mudanças de schema sem apagar dados.

---

## Solução de problemas

### "Cannot connect to database"

- Verifique se o PostgreSQL está em execução: `pg_isready -h localhost -p 5432`
- Confirme as credenciais e que o utilizador tem permissão de acesso ao banco

### "Port already in use"

- Altere as portas durante a instalação (perguntas 4 e 5)
- Ou pare o processo que usa a porta: `lsof -i :3000` (Linux/macOS) / `netstat -ano | findstr :3000` (Windows)

### "pm2 not found" após instalação

- Execute: `npm install -g pm2`
- Em Linux/macOS pode ser necessário: `sudo npm install -g pm2`

### Logs de erro

```bash
pm2 logs kreato-backend --lines 50
pm2 logs kreato-frontend --lines 50
# ou
cat .logs/backend.err.log
cat .logs/frontend.err.log
```
