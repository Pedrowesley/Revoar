#!/usr/bin/env bash
#
# restart-dev.sh — mata processos nas portas 3000-3002, reinicia Docker e sobe o dev stack.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log()  { printf "\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✔ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m! %s\033[0m\n" "$*"; }
err()  { printf "\033[1;31m✖ %s\033[0m\n" "$*" >&2; }

# 1. Node 20
log "Selecionando Node 20..."
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use 20 >/dev/null 2>&1 || nvm install 20
fi
ok "Node $(node -v)"

# 2. Matar processos nas portas dos apps
log "Liberando portas 3000, 3001, 3002..."
for port in 3000 3001 3002; do
  pids=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  porta $port -> matando PID(s): $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done
pkill -f "turbo dev" 2>/dev/null || true
pkill -f "next dev --port 3000" 2>/dev/null || true
pkill -f "next dev --port 3001" 2>/dev/null || true
pkill -f "nest start --watch" 2>/dev/null || true
sleep 2

for port in 3000 3001 3002; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    err "Porta $port ainda ocupada. Mate manualmente: lsof -ti:$port | xargs kill -9"
    exit 1
  fi
done
ok "Portas 3000-3002 livres"

# 3. Docker (Postgres + LocalStack)
log "Reiniciando Docker Compose..."
if ! docker info >/dev/null 2>&1; then
  warn "Docker não está rodando. Abrindo Docker Desktop..."
  open -a Docker 2>/dev/null || true
  for _ in $(seq 1 60); do
    docker info >/dev/null 2>&1 && break
    sleep 2
  done
fi
docker compose down
docker compose up -d

log "Aguardando Postgres..."
for _ in $(seq 1 60); do
  status=$(docker inspect -f '{{.State.Health.Status}}' revoar-postgres 2>/dev/null || echo "")
  [ "$status" = "healthy" ] && break
  sleep 2
done
ok "Docker no ar"

# 4. Env files
log "Verificando .env..."
[ -f .env ] || cp .env.example .env
[ -f apps/extranet/.env.local ] || cp apps/extranet/.env.local.example apps/extranet/.env.local
[ -f apps/admin/.env.local ]    || cp apps/admin/.env.local.example apps/admin/.env.local
[ -f apps/api/.env ]            || cp .env apps/api/.env
[ -f packages/database/.env ]   || cp .env packages/database/.env
ok "Env prontos"

# 5. Build packages (necessário para API compilar)
log "Build shared + database..."
npm run build -w @revoar/shared -w @revoar/database

# 6. Dev
log "Iniciando npm run dev..."
npm run dev
