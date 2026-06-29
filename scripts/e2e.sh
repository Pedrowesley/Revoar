#!/usr/bin/env bash
set -euo pipefail

echo "==> Subindo infra (Postgres + LocalStack)"
docker compose up -d

echo "==> Aguardando Postgres..."
until docker compose exec -T postgres pg_isready -U revoar -d revoar >/dev/null 2>&1; do
  sleep 1
done

echo "==> Prisma migrate + seed"
npm run db:generate
npm run db:migrate
npm run db:seed

echo "==> Instalando Playwright (se necessário)"
npx playwright install chromium --with-deps 2>/dev/null || npx playwright install chromium

echo "==> Executando E2E"
npm run test:e2e
