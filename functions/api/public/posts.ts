import type { Env, PostRow } from '../../_lib/db';
import { toPostDTO } from '../../_lib/db';
import { json, error } from '../../_lib/http';
import { getPostTags } from '../../_lib/tags';

// GET /api/public/posts
// Lista posts publicados (sem content_html) para a home agrupar por ano/mês.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, title, slug, excerpt, language, status,
              published_at, created_at, updated_at, '' AS content_html
         FROM posts
        WHERE status = 'published'
        ORDER BY published_at DESC`,
    ).all<PostRow>();

    // content_html continua omitido; as tags existentes são carregadas apenas
    // para enriquecer home e busca, sem qualquer escrita no banco.
    const posts = await Promise.all(results.map(async (row) => {
      try {
        return toPostDTO(row, await getPostTags(env, row.id));
      } catch {
        return toPostDTO(row);
      }
    }));
    return json(posts);
  } catch (e) {
    return error('Failed to load posts.', 500);
  }
};
