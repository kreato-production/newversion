@echo off
chcp 65001 > nul
setlocal

set "PROJECT_DIR=%~dp0"

echo.
echo  ============================================
echo    Kreato Production - Iniciando aplicacao
echo  ============================================
echo.

:: --- 1. PostgreSQL via Docker (opcional) ---
echo  [1/3] Verificando PostgreSQL (Docker)...
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    docker compose -f "%PROJECT_DIR%docker-compose.yml" up postgres -d >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo  PostgreSQL Docker OK
    ) else (
        echo  AVISO: Docker nao iniciou o PostgreSQL - assumindo que ja esta rodando.
    )
) else (
    echo  Docker nao encontrado - assumindo PostgreSQL ja esta rodando.
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

:: --- 3. Frontend (porta 3000) ---
echo  [3/3] Iniciando Frontend (porta 3000)...
start "Kreato - Frontend" cmd /k "cd /d "%PROJECT_DIR%" && npm run dev"
echo  Frontend iniciado em nova janela.
echo.

echo  ============================================
echo    Aplicacao no ar!
echo.
echo    Backend:  http://localhost:3333
echo    Frontend: http://localhost:3000
echo  ============================================
echo.
pause
