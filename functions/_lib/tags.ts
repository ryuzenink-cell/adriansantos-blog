import type { Env } from './db';
import { slugify } from './slugify';

/** Nomes de tags de um post (ordenados). */
export async function getPostTags(env: Env, postId: number): Promise<string[]> {
  const { results } = await env.DB.prepare(
    `SELECT t.name AS name
       FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
      WHERE pt.post_id = ?
      ORDER BY t.name`,
  )
    .bind(postId)
    .all<{ name: string }>();
  return results.map((r) => r.name);
}

/** Substitui as tags de um post (cria as que faltarem em `tags`). */
export async function syncPostTags(env: Env, postId: number, names: string[]): Promise<void> {
  await env.DB.prepare('DELETE FROM post_tags WHERE post_id = ?').bind(postId).run();

  const clean = Array.from(
    new Set(names.map((n) => n.trim()).filter(Boolean)),
  );

  for (const name of clean) {
    const tagSlug = slugify(name) || name.toLowerCase();
    await env.DB.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)')
      .bind(name, tagSlug)
      .run();
    const tag = await env.DB.prepare('SELECT id FROM tags WHERE slug = ?')
      .bind(tagSlug)
      .first<{ id: number }>();
    if (tag) {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
      )
        .bind(postId, tag.id)
        .run();
    }
  }
}
