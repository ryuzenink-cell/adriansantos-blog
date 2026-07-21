// ============================================================================
// Busca o index.html compilado pelo Vite através do binding de assets do
// Cloudflare Pages (`env.ASSETS`), para servir de base às páginas renderizadas
// no servidor (posts, 404). Preserva CSS, favicon, manifest, GA, PWA etc. —
// já presentes no documento — e só é transformado pelo chamador via
// HTMLRewriter.
// ============================================================================

import type { Env } from './db';

/** Busca o index.html do build via o binding de assets estáticos do Pages. */
export async function fetchIndexShell(env: Env, request: Request): Promise<Response> {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/index.html';
  assetUrl.search = '';
  return env.ASSETS.fetch(new Request(assetUrl.toString(), { headers: request.headers }));
}
