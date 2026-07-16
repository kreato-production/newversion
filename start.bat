@echo off
chcp 65001 > nul
setlocal

set "PROJECT_DIR=%~dp0"

echo.
echo  ============================================
echo    Kreato Production - Iniciando aplicacao
echo  ============================================
echo.

:: --- 1. PostgreSQL (servico nativo do Windows) ---
echo  [1/3] Verificando PostgreSQL...
net start | findstr /i "postgresql" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  PostgreSQL ja esta em execucao.
) else (
    echo  AVISO: nenhum servico PostgreSQL em execucao foi encontrado.
    echo  Inicie-o em services.msc ou com "net start postgresql-x64-16" antes de continuar.
)
echo.

:: Aguarda o Postgres estar pronto
timeout /t 2 /nobreak > nul

:: --- 2. Backend (porta 3333) ---
echo  [2/3] Iniciando Backend (porta 3333)...
start "Kreato - Backend" cmd /k "cd /d "%PROJECT_DIR%backend" && npm run dev"
echo  Backend iniciado em nova janela.
echo.

timeout /t 2 /nobreak > nul

:: --- 3. Frontend (porta 3001) ---
echo  [3/3] Iniciando Frontend (porta 3001)...
start "Kreato - Frontend" cmd /k "cd /d "%PROJECT_DIR%" && npm run dev"
echo  Frontend iniciado em nova janela.
echo.

echo  ============================================
echo    Aplicacao no ar!
echo.
echo    Backend:  http://localhost:3333
echo    Frontend: http://localhost:3001
echo  ============================================
echo.
pause
