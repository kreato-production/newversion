# ╔══════════════════════════════════════════════╗
# ║     KREATO PRODUCTION — Instalador           ║
# ║     Windows PowerShell                       ║
# ╚══════════════════════════════════════════════╝
# Uso: powershell -ExecutionPolicy Bypass -File install.ps1

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host " ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host " ║     KREATO PRODUCTION — INSTALADOR           ║" -ForegroundColor Cyan
Write-Host " ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Verificar Node.js ─────────────────────────────────────────────────────────
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host " [ERRO] Node.js nao encontrado." -ForegroundColor Red
    Write-Host ""
    Write-Host " Instale Node.js 18+ antes de continuar:"
    Write-Host "   https://nodejs.org/en/download" -ForegroundColor Cyan
    Write-Host ""
    $open = Read-Host " Abrir pagina de download? (s/n)"
    if ($open -eq 's') { Start-Process "https://nodejs.org/en/download" }
    exit 1
}

$nodeVersion = (node -e "process.stdout.write(process.versions.node)").Trim()
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 18) {
    Write-Host " [ERRO] Node.js $nodeVersion encontrado, mas e necessario Node.js 18+." -ForegroundColor Red
    Write-Host " Atualize em https://nodejs.org"
    exit 1
}
Write-Host " [OK] Node.js $nodeVersion" -ForegroundColor Green

# ── Verificar npm ─────────────────────────────────────────────────────────────
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Host " [ERRO] npm nao encontrado." -ForegroundColor Red
    exit 1
}
Write-Host " [OK] npm disponivel" -ForegroundColor Green
Write-Host ""

# ── Executar instalador principal ─────────────────────────────────────────────
Set-Location $Root
node installer\install.js

Write-Host ""
Read-Host "Pressione Enter para fechar"
