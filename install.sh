#!/usr/bin/env bash
# ╔══════════════════════════════════════════════╗
# ║     KREATO PRODUCTION — Instalador           ║
# ║     Linux / macOS                            ║
# ╚══════════════════════════════════════════════╝
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║     KREATO PRODUCTION — INSTALADOR           ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Verificar Node.js ────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js não encontrado.${NC}"
  echo ""
  echo "  Instale Node.js 18+ antes de continuar:"
  echo ""

  OS="$(uname -s)"
  case "$OS" in
    Linux)
      echo "  Ubuntu/Debian:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
      echo "                  sudo apt-get install -y nodejs"
      echo ""
      echo "  Fedora/RHEL:    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
      echo "                  sudo dnf install -y nodejs"
      ;;
    Darwin)
      echo "  Homebrew:  brew install node"
      echo "  ou acesse: https://nodejs.org"
      ;;
    *)
      echo "  Acesse: https://nodejs.org"
      ;;
  esac
  echo ""
  exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${RED}✗ Node.js $(node --version) encontrado, mas é necessário Node.js 18+.${NC}"
  echo "  Atualize em https://nodejs.org"
  exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node --version) encontrado"

# ── Verificar npm ────────────────────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
  echo -e "${RED}✗ npm não encontrado.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm --version) encontrado"
echo ""

# ── Executar instalador principal ────────────────────────────────────────────
cd "$SCRIPT_DIR"
node installer/install.js
