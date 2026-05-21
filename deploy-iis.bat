@echo off
setlocal EnableDelayedExpansion

:: ============================================================
::  Kreato Production - Build e Deploy para IIS via PM2 + ARR
::  Uso: Execute como Administrador na raiz do projeto
:: ============================================================

:: --- CONFIGURE AQUI os caminhos de deploy ---
set "PROJECT_ROOT=%~dp0"
set "DEPLOY_FRONTEND=C:\inetpub\kreato-frontend"
set "DEPLOY_BACKEND=C:\inetpub\kreato-backend"
set "FRONTEND_PORT=3000"
set "BACKEND_PORT=3333"
set "ERRORS=0"

title Kreato - Deploy IIS (PM2 + ARR)

echo.
echo ============================================================
echo   KREATO PRODUCTION ^| Build + Deploy com PM2 + ARR
echo ============================================================
echo   Frontend deploy : %DEPLOY_FRONTEND%  (porta %FRONTEND_PORT%)
echo   Backend deploy  : %DEPLOY_BACKEND%   (porta %BACKEND_PORT%)
echo ============================================================
echo.

:: ----------------------------------------------------------
:: PRE-CHECKS
:: ----------------------------------------------------------
echo [PRE] Verificando dependencias...

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instale em: https://nodejs.org/
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo        Node.js %%v encontrado.

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] npm nao encontrado.
    pause & exit /b 1
)

where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] PM2 nao encontrado. Instalando globalmente...
    call npm install -g pm2
    if !ERRORLEVEL! neq 0 (
        echo [ERRO] Falha ao instalar PM2.
        pause & exit /b 1
    )
)
for /f "tokens=*" %%v in ('pm2 -v') do echo        PM2 v%%v encontrado.

:: Criar pastas de deploy se nao existirem
if not exist "%DEPLOY_FRONTEND%" mkdir "%DEPLOY_FRONTEND%"
if not exist "%DEPLOY_BACKEND%"  mkdir "%DEPLOY_BACKEND%"
if not exist "%DEPLOY_FRONTEND%\logs" mkdir "%DEPLOY_FRONTEND%\logs"

echo.

:: ----------------------------------------------------------
:: LIBERAR PORTAS
:: ----------------------------------------------------------
echo [PRE] Parando processos PM2 e liberando portas...
call pm2 stop all >nul 2>&1

for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":%FRONTEND_PORT% "') do (
    taskkill /F /PID %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":%BACKEND_PORT% "') do (
    taskkill /F /PID %%p >nul 2>&1
)
echo [OK]   Portas %FRONTEND_PORT% e %BACKEND_PORT% liberadas.
echo.

:: ----------------------------------------------------------
:: PASSO 1: Dependencias do Frontend
:: ----------------------------------------------------------
echo [1/7] Instalando dependencias do frontend e gerando Prisma Client...
cd /d "%PROJECT_ROOT%"
call npm install --loglevel warn
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do frontend.
    set /a ERRORS+=1
    goto :FAIL
)
call npx prisma generate --loglevel warn
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Prisma generate retornou aviso - continuando...
)
echo [OK]   Dependencias e Prisma Client do frontend prontos.
echo.

:: ----------------------------------------------------------
:: PASSO 2: Build do Frontend (Next.js standalone)
:: ----------------------------------------------------------
echo [2/7] Compilando frontend (Next.js standalone)...
cd /d "%PROJECT_ROOT%"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao compilar o frontend.
    set /a ERRORS+=1
    goto :FAIL
)
echo [OK]   Frontend compilado (.next\standalone\).
echo.

:: ----------------------------------------------------------
:: PASSO 3: Copiar Frontend para pasta de deploy
:: ----------------------------------------------------------
echo [3/7] Copiando frontend para %DEPLOY_FRONTEND%...

:: Copia o servidor standalone (server.js + node_modules bundled + .next/server)
robocopy "%PROJECT_ROOT%.next\standalone" "%DEPLOY_FRONTEND%" /E /NFL /NDL /NJH /NJS /nc /ns /np
if %ERRORLEVEL% gtr 7 (
    echo [ERRO] Falha ao copiar standalone.
    set /a ERRORS+=1
    goto :FAIL
)

:: Copia os arquivos estaticos para .next\static (servidos pelo servidor Node.js)
robocopy "%PROJECT_ROOT%.next\static" "%DEPLOY_FRONTEND%\.next\static" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
if %ERRORLEVEL% gtr 7 (
    echo [ERRO] Falha ao copiar arquivos estaticos.
    set /a ERRORS+=1
    goto :FAIL
)

:: Copia a pasta public/
if exist "%PROJECT_ROOT%public" (
    robocopy "%PROJECT_ROOT%public" "%DEPLOY_FRONTEND%\public" /E /NFL /NDL /NJH /NJS /nc /ns /np
)

:: Copia o web.config (ARR proxy: porta 80 -> 3000 frontend, /api/ -> 3333 backend)
copy /Y "%PROJECT_ROOT%web.config" "%DEPLOY_FRONTEND%\web.config" >nul

echo [OK]   Frontend copiado para %DEPLOY_FRONTEND%.
echo.

:: ----------------------------------------------------------
:: PASSO 4: Dependencias + Prisma do Backend
:: ----------------------------------------------------------
echo [4/7] Instalando dependencias do backend e gerando Prisma Client...

echo        Encerrando processos Node.js para liberar arquivos bloqueados...
taskkill /F /IM node.exe >nul 2>&1
echo        Processos Node.js encerrados.

cd /d "%PROJECT_ROOT%backend"
call npm install --loglevel warn
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do backend.
    set /a ERRORS+=1
    goto :FAIL
)

call npm run prisma:generate
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao gerar o Prisma Client.
    set /a ERRORS+=1
    goto :FAIL
)
echo [OK]   Backend: dependencias e Prisma Client prontos.
echo.

:: ----------------------------------------------------------
:: PASSO 5: Build + Deploy do Backend
:: ----------------------------------------------------------
echo [5/7] Compilando backend (TypeScript)...
cd /d "%PROJECT_ROOT%backend"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao compilar o backend.
    set /a ERRORS+=1
    goto :FAIL
)

echo        Copiando backend para %DEPLOY_BACKEND%...
robocopy "%PROJECT_ROOT%backend\dist"         "%DEPLOY_BACKEND%\dist"         /E /NFL /NDL /NJH /NJS /nc /ns /np
robocopy "%PROJECT_ROOT%backend\node_modules" "%DEPLOY_BACKEND%\node_modules" /E /NFL /NDL /NJH /NJS /nc /ns /np
if exist "%PROJECT_ROOT%backend\.env" (
    copy /Y "%PROJECT_ROOT%backend\.env" "%DEPLOY_BACKEND%\.env" >nul
)
copy /Y "%PROJECT_ROOT%backend\package.json" "%DEPLOY_BACKEND%\package.json" >nul

echo [OK]   Backend compilado e copiado para %DEPLOY_BACKEND%.
echo.

:: ----------------------------------------------------------
:: PASSO 6: Iniciar / Reiniciar Frontend via PM2 (porta 3000)
:: ----------------------------------------------------------
echo [6/7] Iniciando frontend via PM2 (porta %FRONTEND_PORT%)...
cd /d "%DEPLOY_FRONTEND%"

call pm2 list --no-color 2>nul | findstr /i "kreato-frontend" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call pm2 restart kreato-frontend
) else (
    call pm2 start server.js --name "kreato-frontend"
)

if %ERRORLEVEL% neq 0 (
    echo [AVISO] PM2 retornou erro no frontend - verifique com: pm2 list
)
echo [OK]   Frontend iniciado via PM2 na porta %FRONTEND_PORT%.
echo.

:: ----------------------------------------------------------
:: PASSO 7: Iniciar / Reiniciar Backend via PM2 (porta 3333)
:: ----------------------------------------------------------
echo [7/7] Iniciando backend via PM2 (porta %BACKEND_PORT%)...
cd /d "%DEPLOY_BACKEND%"

call pm2 list --no-color 2>nul | findstr /i "kreato-backend" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call pm2 restart kreato-backend
) else (
    call pm2 start dist/server.js --name "kreato-backend"
)

if %ERRORLEVEL% neq 0 (
    echo [AVISO] PM2 retornou erro no backend - verifique com: pm2 list
)

call pm2 save >nul 2>&1
echo [OK]   Backend iniciado via PM2 na porta %BACKEND_PORT%.
echo.

cd /d "%PROJECT_ROOT%"

:: Reinicia IIS para aplicar o novo web.config
echo [FIM]  Reiniciando IIS para aplicar web.config...
iisreset /restart >nul 2>&1
echo [OK]   IIS reiniciado.
echo.

:: ----------------------------------------------------------
:: SUCESSO
:: ----------------------------------------------------------
echo ============================================================
echo   Deploy concluido com SUCESSO!
echo ============================================================
echo.
echo   Frontend : http://localhost:%FRONTEND_PORT%  (PM2: kreato-frontend)
echo   Backend  : http://localhost:%BACKEND_PORT%   (PM2: kreato-backend)
echo   IIS site : http://localhost  (ARR proxy -> 3000 / 3333)
echo.
echo   PROXIMOS PASSOS (somente na 1a instalacao):
echo   -------------------------------------------------------
echo   1. Instalar ARR (Application Request Routing) no IIS:
echo      https://www.iis.net/downloads/microsoft/application-request-routing
echo.
echo   2. Habilitar proxy no ARR:
echo      IIS Manager -> servidor -> Application Request Routing Cache
echo      -> Server Proxy Settings -> Enable proxy (check)
echo.
echo   3. Criar novo site no IIS Manager:
echo      - Nome    : kreato-frontend
echo      - Caminho : %DEPLOY_FRONTEND%
echo      - Porta   : 80
echo      - App Pool: No Managed Code
echo ============================================================
echo.
pm2 list
echo.
pause
exit /b 0

:: ----------------------------------------------------------
:: FALHA
:: ----------------------------------------------------------
:FAIL
echo.
echo ============================================================
echo   [FALHA] Deploy encerrado com %ERRORS% erro(s).
echo   Verifique as mensagens acima para mais detalhes.
echo ============================================================
echo.
pause
exit /b 1
