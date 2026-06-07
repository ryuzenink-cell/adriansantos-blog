import type { Env, PostRow } from '../../_lib/db';
import { toPostDTO } from '../../_lib/db';
import { json, error, readJson } from '../../_lib/http';
import { sanitizeHtml } from '../../_lib/sanitize';
import { slugify, ensureUniqueSlug } from '../../_lib/slugify';
import { getPostTags, syncPostTags } from '../../_lib/tags';

interface PostBody {
  title?: string;
  slug?: string;
  excerpt?: string;
  content_html?: string;
  language?: string;
  status?: string;
  published_at?: string;
  tags?: string[];
}

const normLang = (v?: string) => (v === 'pt' ? 'pt' : 'en');
const normStatus = (v?: string) => (v === 'published' ? 'published' : 'draft');

function parseId(params: Record<string, string | string[]>): number | null {
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/posts/:id — busca um post para edição.
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const id = parseId(params);
  if (!id) return error('Invalid id.', 400);

  const row = await env.DB.prepare('SELECT * FROM posts WHERE id = ?')
    .bind(id)
    .first<PostRow>();
  if (!row) return error('Post not found.', 404);

  const tags = await getPostTags(env, id);
  return json(toPostDTO(row, tags));
};

// PUT /api/posts/:id — atualiza um post.
export const onRequestPut: PagesFunction<Env> = async ({ env, request, params }) => {
  const id = parseId(params);
  if (!id) return error('Invalid id.', 400);

  const existing = await env.DB.prepare('SELECT * FROM posts WHERE id = ?')
    .bind(id)
    .first<PostRow>();
  if (!existing) return error('Post not found.', 404);

  const body = await readJson<PostBody>(request);
  if (!body) return error('Invalid JSON body.', 400);

  const title = body.title?.trim();
  const contentRaw = body.content_html ?? '';
  if (!title) return error('Title is required.', 400);
  if (!contentRaw.trim()) return error('Content is required.', 400);

  const language = normLang(body.language);
  const status = normStatus(body.status);
  const excerpt = body.excerpt?.trim() ?? '';
  const content_html = sanitizeHtml(contentRaw);

  const baseSlug = slugify(body.slug?.trim() || title);
  const slug = await ensureUniqueSlug(env, baseSlug, id);

  // Se publicar e não houver data, usa agora (preserva data já existente).
  let published_at: string | null = body.published_at?.trim() || existing.published_at;
  if (status === 'published' && !published_at) {
    published_at = new Date().toISOString();
  }
  if (status === 'draft') {
    // Mantém published_at do payload se enviado; senão preserva o anterior.
    published_at = body.published_at?.trim() ?? existing.published_at;
  }

  const now = new Date().toISOString();

  await env.DB.prepare(
    `UPDATE posts
        SET title = ?, slug = ?, excerpt = ?, content_html = ?, language = ?,
            status = ?, published_at = ?, updated_at = ?
      WHERE id = ?`,
  )
    .bind(title, slug, excerpt, content_html, language, status, published_at, now, id)
    .run();

  if (Array.isArray(body.tags)) await syncPostTags(env, id, body.tags);

  const row = await env.DB.prepare('SELECT * FROM posts WHERE id = ?')
    .bind(id)
    .first<PostRow>();
  const tags = await getPostTags(env, id);

  return json(toPostDTO(row!, tags));
};

// DELETE /api/posts/:id — exclui o post (post_tags caem por cascade).
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const id = parseId(params);
  if (!id) return error('Invalid id.', 400);

  const existing = await env.DB.prepare('SELECT id FROM posts WHERE id = ?')
    .bind(id)
    .first<{ id: number }>();
  if (!existing) return error('Post not found.', 404);

  await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  return json({ ok: true });
};
