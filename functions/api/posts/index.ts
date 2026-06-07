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

// GET /api/posts — lista TODOS os posts (draft + published) para o admin.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, title, slug, excerpt, content_html, language, status,
            published_at, created_at, updated_at
       FROM posts
      ORDER BY updated_at DESC, created_at DESC`,
  ).all<PostRow>();
  return json(results.map((r) => toPostDTO(r)));
};

// POST /api/posts — cria um post.
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
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

  // Slug: usa o enviado ou deriva do título; garante unicidade.
  const baseSlug = slugify(body.slug?.trim() || title);
  const slug = await ensureUniqueSlug(env, baseSlug);

  // published_at: respeita o enviado; se publicar sem data, usa agora.
  let published_at: string | null = body.published_at?.trim() || null;
  if (status === 'published' && !published_at) {
    published_at = new Date().toISOString();
  }

  const now = new Date().toISOString();

  const res = await env.DB.prepare(
    `INSERT INTO posts (title, slug, excerpt, content_html, language, status,
                        published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(title, slug, excerpt, content_html, language, status, published_at, now, now)
    .run();

  const id = Number(res.meta.last_row_id);
  if (Array.isArray(body.tags)) await syncPostTags(env, id, body.tags);

  const row = await env.DB.prepare('SELECT * FROM posts WHERE id = ?')
    .bind(id)
    .first<PostRow>();
  const tags = await getPostTags(env, id);

  return json(toPostDTO(row!, tags), 201);
};
