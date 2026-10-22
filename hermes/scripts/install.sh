#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Hermes Install Script — Linux / macOS
#  Usage: bash scripts/install.sh [--no-install]
#    --no-install  : skip `pip install -e .` (just create dirs and copy files)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

HERMES_DIR="$HOME/.hermes"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'
GOLD='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'
BOLD='\033[1m'

info()    { echo -e "${GOLD}  •${RESET} $*"; }
success() { echo -e "${GREEN}  ✓${RESET} $*"; }
error()   { echo -e "${RED}  ✗ ERROR:${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}${GOLD}$*${RESET}\n"; }

header "⚡ Hermes — ProCare AI Hub  |  Install Script"

# ── 1. Create ~/.hermes directory ─────────────────────────────────────────────
info "Creating ${HERMES_DIR} ..."
mkdir -p "$HERMES_DIR"
success "Directory created: ${HERMES_DIR}"

# ── 2. Copy .env.example if no .env exists ────────────────────────────────────
ENV_EXAMPLE="$PROJECT_DIR/.env.example"
ENV_TARGET="$HERMES_DIR/.env"

if [ -f "$ENV_EXAMPLE" ] && [ ! -f "$ENV_TARGET" ]; then
    cp "$ENV_EXAMPLE" "$ENV_TARGET"
    success "Copied .env.example → ${ENV_TARGET}"
elif [ -f "$ENV_TARGET" ]; then
    info ".env already exists at ${ENV_TARGET} (not overwriting)"
else
    error ".env.example not found at ${ENV_EXAMPLE}"
fi

# ── 3. Install Python dependencies ────────────────────────────────────────────
SKIP_INSTALL=false
for arg in "$@"; do
    [[ "$arg" == "--no-install" ]] && SKIP_INSTALL=true
done

if [ "$SKIP_INSTALL" = false ]; then
    if command -v pip3 &>/dev/null; then
        PIP=pip3
    elif command -v pip &>/dev/null; then
        PIP=pip
    else
        error "pip not found. Install Python 3.11+ and pip, then re-run."
        exit 1
    fi

    info "Installing Python dependencies (pip install -e .) ..."
    (cd "$PROJECT_DIR" && "$PIP" install -e . --quiet)
    success "Python package installed (hermes CLI is now available)"
else
    info "Skipping pip install (--no-install flag set)"
fi

# ── 4. Initialize the database ────────────────────────────────────────────────
if command -v hermes &>/dev/null; then
    info "Initializing Hermes database ..."
    hermes init --quiet 2>/dev/null || true
    success "Database initialized"
else
    info "hermes CLI not found in PATH — skipping DB init (run 'hermes init' manually)"
fi

# ── 5. Print setup checklist ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GOLD}══════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Setup Checklist${RESET}"
echo -e "${GOLD}══════════════════════════════════════════════════${RESET}"
echo ""
echo -e "  ${GOLD}[1]${RESET} Edit your API keys:"
echo -e "      ${BOLD}${ENV_TARGET}${RESET}"
echo ""
echo -e "  ${GOLD}[2]${RESET} Add your ${BOLD}ANTHROPIC_API_KEY${RESET} (for Claude)"
echo -e "  ${GOLD}[3]${RESET} Add your ${BOLD}GEMINI_API_KEY${RESET} (for Gemini)"
echo -e "  ${GOLD}[4]${RESET} (Optional) Set ${BOLD}PHARMACY_WEBHOOK_URL${RESET}"
echo ""
echo -e "  ${GOLD}[5]${RESET} Verify setup:"
echo -e "      ${BOLD}hermes status${RESET}"
echo ""
echo -e "  ${GOLD}[6]${RESET} Start chatting:"
echo -e "      ${BOLD}hermes chat${RESET}"
echo ""
echo -e "${GOLD}══════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}  Install complete!${RESET}"
echo ""
