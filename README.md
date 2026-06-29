# MASTER PLAN — REVOAR

Plataforma digital de turismo focada em reserva de hotéis, com evolução para ecossistema completo de viagens.

## Para agentes Cursor / novo desenvolvedor

Leia nesta ordem antes de implementar qualquer coisa:

1. [`.specs/STATE.md`](./.specs/STATE.md) — decisões, handoff, próximo passo
2. [`RELEASE-0.0.md`](./RELEASE-0.0.md) — o que foi entregue vs. gaps
3. [`.specs/features/admin-cadastro-parceiros/spec.md`](./.specs/features/admin-cadastro-parceiros/spec.md) — requisitos
4. [`DEVELOPMENT.md`](./DEVELOPMENT.md) — setup, API, testes

**Release 0.0 está concluída no código.** Próximo milestone: Release 0.1 (busca pública).

## Estrutura de documentação

| Fase | Diretório | Documento |
|------|-----------|-----------|
| 0 — Análise de Mercado | `docs/00-analise-de-mercado/` | `fase-00-analise-de-mercado.md` |
| 1 — Product Discovery | `docs/01-product-discovery/` | `fase-01-product-discovery.md` |
| 2 — Modelo de Negócio | `docs/02-modelo-de-negocio/` | `fase-02-modelo-de-negocio.md` |
| 3 — Requisitos | `docs/03-requisitos/` | `fase-03-requisitos.md` |
| 4 — UX | `docs/04-ux/` | `fase-04-ux.md` |
| 5 — System Design | `docs/05-system-design/` | `fase-05-system-design.md` |
| 6 — Modelagem de Dados | `docs/06-modelagem-dados/` | `fase-06-modelagem-dados.md` |
| 7 — Integrações | `docs/07-integracoes/` | `fase-07-integracoes.md` |
| 8 — Análise de Riscos | `docs/08-analise-riscos/` | `fase-08-analise-riscos.md` |
| 9 — Roadmap | `docs/09-roadmap/` | `fase-09-roadmap.md` |
| 10 — Diagramas | `docs/10-diagramas/` | `fase-10-diagramas.md` |

## Regra de leitura

Cada fase referencia e estende as anteriores. Leia em ordem numérica para contexto completo.

## Desenvolvimento

Ver [DEVELOPMENT.md](./DEVELOPMENT.md) para setup do monorepo (extranet + admin + API).

Quick start (~15 min):

```bash
cp .env.example .env
cp apps/extranet/.env.local.example apps/extranet/.env.local
cp apps/admin/.env.local.example apps/admin/.env.local
docker compose up -d
npm install
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev
```

| App | URL | Login seed |
|-----|-----|------------|
| Extranet | http://localhost:3000 | parceiro@revoar.com.br / revoar123 |
| Admin | http://localhost:3001 | admin@revoar.com.br / revoar123 |
| API | http://localhost:3002/health | — |

**Release 0.0** implementada: extranet (cadastro parceiro/hotel/quartos/fotos) + admin (moderação).  
Detalhes: [`RELEASE-0.0.md`](./RELEASE-0.0.md) · Validação: [`.specs/features/admin-cadastro-parceiros/validation.md`](./.specs/features/admin-cadastro-parceiros/validation.md)

## Exportar PDF

```bash
cd ~/Documents/plan-revoar
npm install          # só na primeira vez
npm run pdf          # gera todos os PDFs em pdf/
```

Um arquivo específico:

```bash
npm run pdf:single docs/08-analise-riscos/fase-08-analise-riscos.md
```

Os PDFs ficam em `pdf/`. Diagramas Mermaid viram imagens automaticamente (exceto sintaxes exóticas como C4).
