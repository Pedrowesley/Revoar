const API_URL = process.env.API_URL ?? "http://localhost:3002";

export default async function globalSetup() {
  try {
    const response = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`API health check failed (${response.status})`);
    }
  } catch {
    throw new Error(
      "API indisponível em http://localhost:3002. Execute: docker compose up -d && npm run db:migrate && npm run db:seed && npm run dev",
    );
  }
}
