#!/usr/bin/env bash
set -e

# ==============================================================================
# pondok-ai — Cross-Platform One-Command Installer (macOS & Linux)
# ==============================================================================

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
NC="\033[0m"

echo -e "${CYAN}${BOLD}"
echo "╭─────────────────────────────────╮"
echo "│                                 │"
echo "│            PONDOK AI            │"
echo "│   Your private AI environment   │"
echo "│                                 │"
echo "╰─────────────────────────────────╯"
echo -e "${NC}"

echo -e "${BOLD}Checking prerequisites...${NC}"

# 1. Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"
echo -e "  Operating System: ${GREEN}${OS} (${ARCH})${NC}"

# 2. Check Node.js
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 22 ]; then
    echo -e "  Node.js:          ${GREEN}v${NODE_VER}${NC}"
  else
    echo -e "  Node.js:          ${RED}v${NODE_VER} (Node.js 22+ required)${NC}"
    echo -e "${RED}Error: Node.js (v22+) is required to run pondok-ai.${NC}"
    echo -e "Please install Node.js from: https://nodejs.org/"
    exit 1
  fi
else
  echo -e "  Node.js:          ${RED}Not installed${NC}"
  echo -e "${RED}Error: Node.js (v22+) is required to run pondok-ai.${NC}"
  echo -e "Please install Node.js from: https://nodejs.org/"
  exit 1
fi

# 3. Check Docker
if command -v docker >/dev/null 2>&1; then
  DOCKER_VER=$(docker --version | awk '{print $3}' | sed 's/,//')
  echo -e "  Docker:           ${GREEN}v${DOCKER_VER}${NC}"
  
  if docker info >/dev/null 2>&1; then
    echo -e "  Docker Daemon:    ${GREEN}Running${NC}"
  else
    echo -e "  Docker Daemon:    ${YELLOW}Not running${NC}"
    echo -e "${YELLOW}Warning: Docker is installed but the daemon is not running.${NC}"
    echo -e "Please start Docker Desktop or the docker service, then re-run.${NC}"
  fi
else
  echo -e "  Docker:           ${YELLOW}Not detected${NC}"
  echo -e "${YELLOW}Notice: Docker is required to spin up the local AI containers.${NC}"
  echo -e "Download Docker Desktop: https://www.docker.com/products/docker-desktop/"
fi

# 4. Check Docker Compose
if docker compose version >/dev/null 2>&1; then
  COMPOSE_VER=$(docker compose version | awk '{print $4}')
  echo -e "  Docker Compose:   ${GREEN}${COMPOSE_VER}${NC}"
fi

echo ""
echo -e "${BOLD}Launching pondok-ai initialization...${NC}"
echo ""

# Run via npx or local cli binary if in repository
if [ -f "dist/index.js" ]; then
  node dist/index.js init "$@"
  node dist/index.js up
else
  npx pondok-ai init "$@"
  npx pondok-ai up
fi
