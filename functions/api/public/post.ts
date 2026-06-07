import type { Env, PostRow } from '../../_lib/db';
import { toPostDTO } from '../../_lib/db';
import { json, error } from '../../_lib/http';
import { getPostTags } from '../../_lib/tags';

// GET /api/public/post?slug=...
// Retorna um post publicado pelo slug (com content_html já sanitizado no save).
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return error('Missing slug.', 400);

  try {
    const row = await env.DB.prepare(
      `SELECT id, title, slug, excerpt, content_html, language, status,
              published_at, created_at, updated_at
         FROM posts
        WHERE slug = ? AND status = 'published'`,
    )
      .bind(slug)
      .first<PostRow>();

    if (!row) return error('Post not found.', 404);

    const tags = await getPostTags(env, row.id);
    return json(toPostDTO(row, tags));
  } catch (e) {
    return error('Failed to load post.', 500);
  }
};
