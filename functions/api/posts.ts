// ============================================================================
//  STUB — Cloudflare Pages Function (NÃO usado na etapa local atual).
//
//  Quando você for plugar o D1 real, este arquivo passa a responder em
//  GET /api/posts. O front (src/lib/postsRepository.ts) trocará o acesso ao
//  localStorage por `fetch('/api/posts')` — o resto do app continua igual.
//
//  Pré-requisitos:
//   1. Binding do D1 em wrangler.toml / no painel do Pages como `DB`.
//   2. Schema aplicado (ver schema.sql).
//
//  Doc: https://developers.cloudflare.com/pages/functions/
// ============================================================================

// Tipagem mínima do ambiente (instale @cloudflare/workers-types para a real):
interface Env {
  DB: D1Database;
}

// Estes tipos vêm de @cloudflare/workers-types; declarados aqui só para o stub.
declare interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): { all(): Promise<{ results: unknown[] }> };
    all(): Promise<{ results: unknown[] }>;
  };
}
declare interface EventContext<E> {
  env: E;
  request: Request;
}

/** GET /api/posts — lista posts publicados (exemplo). */
export const onRequestGet = async (context: EventContext<Env>): Promise<Response> => {
  const { results } = await context.env.DB.prepare(
    `SELECT id, title, slug, excerpt, content_html, language, status,
            published_at, created_at, updated_at
       FROM posts
      WHERE status = 'published'
      ORDER BY published_at DESC`,
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { 'content-type': 'application/json' },
  });
};

// TODO (futuro):
//  - onRequestPost: criar post (protegido por sessão de admin).
//  - /api/posts/[slug].ts: post individual + junção com tags via post_tags.
//  - /api/admin/login.ts: validar admin_users com hash + emitir cookie HttpOnly.
