import type { Post, Language } from '../types';
import { monthName } from './date';

export interface MonthGroup {
  /** Chave estável para âncora/links, ex.: "2026-05". */
  key: string;
  year: number;
  monthIndex: number;
  /** Rótulo já localizado, ex.: "2026 - June" ou "2026 - Junho". */
  label: string;
  posts: Post[];
}

/**
 * Agrupa posts por ano + mês a partir de published_at, em ordem
 * cronológica decrescente (mais recentes primeiro). Posts sem data
 * de publicação são ignorados (não pertencem ao arquivo público).
 */
export function groupPostsByMonth(posts: Post[], lang: Language): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  for (const post of posts) {
    if (!post.published_at) continue;
    const date = new Date(post.published_at);
    if (Number.isNaN(date.getTime())) continue;

    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        year,
        monthIndex,
        label: `${year} - ${monthName(monthIndex, lang)}`,
        posts: [],
      });
    }
    groups.get(key)!.posts.push(post);
  }

  const ordered = Array.from(groups.values()).sort((a, b) => b.key.localeCompare(a.key));

  // Dentro de cada mês, posts mais recentes primeiro.
  for (const group of ordered) {
    group.posts.sort((a, b) => b.published_at.localeCompare(a.published_at));
  }

  return ordered;
}
