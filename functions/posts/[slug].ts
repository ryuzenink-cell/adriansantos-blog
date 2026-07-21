// ============================================================================
// /posts/:slug — renderização server-side do post para crawlers e leitores
// sem JavaScript.
//
// Busca o post publicado direto no D1 (mesma query de functions/api/public/
// post.ts), pega o index.html compilado via env.ASSETS e o transforma com
// HTMLRewriter (ver functions/_lib/post-html.ts) para embutir título,
// conteúdo, data, tags, meta description, canonical, Open Graph, Twitter
// Cards e JSON-LD antes de qualquer JS rodar.
// ============================================================================

import type { Env, PostRow } from '../_lib/db';
import { toPostDTO } from '../_lib/db';
import { fetchIndexShell } from '../_lib/pages-shell';
import { getPostTags } from '../_lib/tags';
import {
  renderErrorDocument,
  renderFallbackErrorPage,
  renderPostDocument,
  type ErrorPageOptions,
} from '../_lib/post-html';

const NOT_FOUND: ErrorPageOptions = {
  status: 404,
  title: 'Post not found | AdrianSantos.blog',
  heading: 'Post not found',
  message: "The post you're looking for doesn't exist or was unpublished.",
};

const SERVICE_UNAVAILABLE: ErrorPageOptions = {
  status: 503,
  title: 'Service unavailable | AdrianSantos.blog',
  heading: 'Something went wrong',
  message: 'We had trouble loading this page. Please try again in a moment.',
};

async function renderError(
  env: Env,
  request: Request,
  options: ErrorPageOptions,
): Promise<Response> {
  try {
    const shell = await fetchIndexShell(env, request);
    if (!shell.ok) return renderFallbackErrorPage(options);
    return renderErrorDocument(shell, options);
  } catch {
    return renderFallbackErrorPage(options);
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request, params }) => {
  const rawSlug = params.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  if (!slug) return renderError(env, request, NOT_FOUND);

  let row: PostRow | null;
  try {
    row = await env.DB.prepare(
      `SELECT id, title, slug, excerpt, content_html, language, status,
              published_at, created_at, updated_at
         FROM posts
        WHERE slug = ? AND status = 'published'`,
    )
      .bind(slug)
      .first<PostRow>();
  } catch {
    return renderError(env, request, SERVICE_UNAVAILABLE);
  }

  if (!row) return renderError(env, request, NOT_FOUND);

  let tags: string[] = [];
  try {
    tags = await getPostTags(env, row.id);
  } catch {
    tags = [];
  }

  const post = toPostDTO(row, tags);

  try {
    const shell = await fetchIndexShell(env, request);
    if (!shell.ok) return renderError(env, request, SERVICE_UNAVAILABLE);
    return renderPostDocument(shell, post);
  } catch {
    return renderError(env, request, SERVICE_UNAVAILABLE);
  }
};
