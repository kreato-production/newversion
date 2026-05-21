@echo off
setlocal

set "ROOT=%~dp0.."
set "BACKEND=%~dp0..\backend"
set "FRONTEND_PORT=3001"
set "BACKEND_PORT=3333"
set "PROJECT_PATH=kreatoproduction"

echo ============================================
echo  Kreato Production - Iniciando projeto...
echo ============================================
echo.

:: --- Encerrar todos os processos node.exe do projeto ---
echo [1/3] Encerrando processos existentes...

:: Mata node.exe cujo caminho de execucao contenha o diretorio do projeto
for /f "tokens=2" %%a in ('wmic process where "name='node.exe'" get processid /format:list 2^>nul ^| findstr "="') do (
    for /f "tokens=*" %%b in ('wmic process where "processid='%%a'" get commandline /format:list 2^>nul ^| findstr /i "%PROJECT_PATH%"') do (
        echo     Encerrando node.exe PID %%a
        taskkill /PID %%a /F >nul 2>&1
    )
)

:: Garante que processos nas portas tambem sejam encerrados
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Aguardar liberacao completa
timeout /t 3 /nobreak >nul

:: --- Iniciar Backend ---
echo [2/3] Iniciando Backend (porta %BACKEND_PORT%)...
start "Kreato Backend" cmd /k "cd /d "%BACKEND%" && npm run dev"

:: Aguardar o backend subir antes do frontend
timeout /t 3 /nobreak >nul

:: --- Iniciar Frontend ---
echo [3/3] Iniciando Frontend (porta %FRONTEND_PORT%)...
start "Kreato Frontend" cmd /k "cd /d "%ROOT%" && npm run dev"

:: Aguardar o frontend responder na porta antes de abrir o browser
echo Aguardando frontend inicializar...
:WAIT_FRONTEND
netstat -aon 2>nul | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto WAIT_FRONTEND
)

:: --- Abrir pagina de login no Microsoft Edge ---
echo Abrindo login no Microsoft Edge...
start msedge "http://localhost:%FRONTEND_PORT%/login"

echo.
echo ============================================
echo  Backend:  http://localhost:%BACKEND_PORT%
echo  Frontend: http://localhost:%FRONTEND_PORT%/login
echo ============================================
echo.

endlocal
