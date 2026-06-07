import type { Env } from './db';

/** Slug URL-safe (versão server, sem dependência de DOM). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Garante slug único na tabela posts. Se já existir, acrescenta -2, -3, ...
 * `excludeId` evita colisão com o próprio post ao editar.
 */
export async function ensureUniqueSlug(
  env: Env,
  base: string,
  excludeId?: number,
): Promise<string> {
  let candidate = base || 'post';
  let n = 2;
  // Loop limitado por segurança.
  for (let i = 0; i < 1000; i++) {
    const row = await env.DB.prepare(
      'SELECT id FROM posts WHERE slug = ? AND id != ?',
    )
      .bind(candidate, excludeId ?? -1)
      .first<{ id: number }>();
    if (!row) return candidate;
    candidate = `${base}-${n++}`;
  }
  // Fallback improvável.
  return `${base}-${Date.now()}`;
}
