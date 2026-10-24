#!/usr/bin/env bash
#
# dev-up.sh — sobe o ambiente de desenvolvimento do Revoar de ponta a ponta:
#   Node 20 (nvm) → .env → Docker (Postgres + LocalStack) → Prisma → apps
#
# Uso:
#   ./scripts/dev-up.sh            # sobe tudo e roda `npm run dev`
#   ./scripts/dev-up.sh --no-dev   # prepara tudo, mas não inicia os apps
#   ./scripts/dev-up.sh --no-seed  # pula o seed do banco
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log()  { printf "\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✔ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m! %s\033[0m\n" "$*"; }
err()  { printf "\033[1;31m✖ %s\033[0m\n" "$*" >&2; }

RUN_DEV=1
RUN_SEED=1
for arg in "$@"; do
  case "$arg" in
    --no-dev)  RUN_DEV=0 ;;
    --no-seed) RUN_SEED=0 ;;
    -h|--help) sed -n '3,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) err "Argumento desconhecido: $arg"; exit 1 ;;
  esac
done

# 1. Node 20 via nvm ----------------------------------------------------------
log "Selecionando Node 20 (nvm)..."
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use 20 >/dev/null 2>&1 || nvm install 20
fi
NODE_MAJOR="$(node -v 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')"
if [ -z "${NODE_MAJOR:-}" ] || [ "$NODE_MAJOR" -lt 20 ]; then
  err "Node >= 20 é obrigatório (atual: $(node -v 2>/dev/null || echo 'nenhum'))."
  err "Instale com: nvm install 20"
  exit 1
fi
ok "Node $(node -v) · npm $(npm -v)"

# 2. Arquivos .env ------------------------------------------------------------
log "Verificando arquivos .env..."
[ -f .env ] || cp .env.example .env
[ -f apps/extranet/.env.local ] || cp apps/extranet/.env.local.example apps/extranet/.env.local
[ -f apps/admin/.env.local ]    || cp apps/admin/.env.local.example apps/admin/.env.local
# A API roda sob o turbo (env-mode strict) com cwd em apps/api, e o Prisma
# roda com cwd em packages/database — ambos precisam do .env na própria pasta.
[ -f apps/api/.env ]            || cp .env apps/api/.env
[ -f packages/database/.env ]   || cp .env packages/database/.env
ok "Arquivos .env prontos"

# Garante DATABASE_URL no ambiente do script (para os comandos Prisma diretos)
set -a; . ./.env; set +a

# 3. Docker daemon ------------------------------------------------------------
log "Verificando Docker..."
if ! docker info >/dev/null 2>&1; then
  warn "Docker não está rodando. Tentando iniciar o Docker Desktop..."
  open -a Docker 2>/dev/null || { err "Abra o Docker Desktop manualmente e rode de novo."; exit 1; }
  printf "  aguardando o daemon"
  for _ in $(seq 1 90); do
    docker info >/dev/null 2>&1 && break
    printf "."
    sleep 2
  done
  printf "\n"
  if ! docker info >/dev/null 2>&1; then
    err "O daemon do Docker não respondeu a tempo. Verifique o Docker Desktop."
    exit 1
  fi
fi
ok "Docker ativo"

# 4. Infra local (Postgres + LocalStack) --------------------------------------
log "Subindo Postgres + LocalStack (docker compose up -d)..."
docker compose up -d

log "Aguardando Postgres ficar saudável..."
PG_STATUS=""
for _ in $(seq 1 60); do
  PG_STATUS="$(docker inspect -f '{{.State.Health.Status}}' revoar-postgres 2>/dev/null || echo '')"
  [ "$PG_STATUS" = "healthy" ] && break
  sleep 2
done
if [ "$PG_STATUS" = "healthy" ]; then
  ok "Postgres saudável"
else
  warn "Postgres ainda não reportou 'healthy' — seguindo mesmo assim."
fi

# 5. Dependências -------------------------------------------------------------
if [ ! -d node_modules ]; then
  log "Instalando dependências (npm install)..."
  npm install
else
  ok "Dependências já instaladas (node_modules presente)"
fi

# 6. Prisma -------------------------------------------------------------------
log "Prisma: generate..."
npm run db:generate
log "Prisma: migrate..."
npm run db:migrate
if [ "$RUN_SEED" -eq 1 ]; then
  log "Prisma: seed..."
  npm run db:seed
else
  warn "Seed pulado (--no-seed)"
fi

# 7. Resumo -------------------------------------------------------------------
ok "Ambiente pronto!"
cat <<'INFO'

  App        URL                              Login (seed)
  ---------- -------------------------------- --------------------------------
  Extranet   http://localhost:3000            parceiro@revoar.com.br / revoar123
  Admin      http://localhost:3001            admin@revoar.com.br / revoar123
  API        http://localhost:3002/health     —

INFO

# 8. Apps ---------------------------------------------------------------------
if [ "$RUN_DEV" -eq 1 ]; then
  log "Iniciando os apps (npm run dev) — Ctrl+C para parar."
  npm run dev
else
  ok "Tudo preparado. Rode 'npm run dev' quando quiser subir os apps."
fi
