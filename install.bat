@echo off
REM ╔══════════════════════════════════════════════╗
REM ║     KREATO PRODUCTION — Instalador           ║
REM ║     Windows                                  ║
REM ╚══════════════════════════════════════════════╝

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     KREATO PRODUCTION — INSTALADOR           ║
echo  ╚══════════════════════════════════════════════╝
echo.

REM ── Verificar Node.js ───────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
  echo  [ERRO] Node.js nao encontrado.
  echo.
  echo  Instale Node.js 18+ antes de continuar:
  echo    https://nodejs.org/en/download
  echo.
  echo  Pressione qualquer tecla para abrir o site de download...
  pause >nul
  start https://nodejs.org/en/download
  exit /b 1
)

for /f "tokens=1" %%V in ('node -e "process.stdout.write(process.versions.node)"') do set NODE_VERSION=%%V
for /f "tokens=1 delims=." %%M in ("%NODE_VERSION%") do set NODE_MAJOR=%%M

if %NODE_MAJOR% LSS 18 (
  echo  [ERRO] Node.js %NODE_VERSION% encontrado, mas e necessario Node.js 18+.
  echo  Atualize em https://nodejs.org
  pause
  exit /b 1
)

echo  [OK] Node.js %NODE_VERSION% encontrado

REM ── Verificar npm ───────────────────────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
  echo  [ERRO] npm nao encontrado.
  pause
  exit /b 1
)
echo  [OK] npm encontrado
echo.

REM ── Executar instalador principal ───────────────────────────────────────────
cd /d "%~dp0"
node installer\install.js

echo.
pause
