import type { Post, PostDraft } from '../types';
import { mockPosts } from '../data/mockPosts';
import { nowIso } from '../utils/date';

/**
 * Camada de acesso a dados (repository).
 *
 * Hoje: persiste em localStorage e devolve Promises (mesmo sendo síncrono),
 * de propósito — assim a interface já é assíncrona como será a versão real.
 *
 * FUTURO (Cloudflare Pages Functions + D1):
 *   substitua o corpo de cada método por chamadas `fetch('/api/posts/...')`.
 *   As Functions consultarão o D1 (env.DB.prepare(...).all() etc.) e a
 *   assinatura pública aqui não precisa mudar — os componentes/hooks que
 *   consomem este módulo continuam iguais.
 *
 *   Exemplo de método futuro:
 *     async list(): Promise<Post[]> {
 *       const res = await fetch('/api/posts');
 *       return res.json();
 *     }
 */

const STORAGE_KEY = 'adriansantos_blog_posts_v1';

function readAll(): Post[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Post[];
  } catch {
    // JSON corrompido — recai no seed.
  }
  // Primeira execução: semeia com os posts mockados.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPosts));
  return mockPosts;
}

function writeAll(posts: Post[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function nextId(posts: Post[]): number {
  return posts.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

export const postsRepository = {
  async list(): Promise<Post[]> {
    return readAll();
  },

  async getBySlug(slug: string): Promise<Post | undefined> {
    return readAll().find((p) => p.slug === slug);
  },

  async getById(id: number): Promise<Post | undefined> {
    return readAll().find((p) => p.id === id);
  },

  async create(draft: PostDraft): Promise<Post> {
    const posts = readAll();
    const timestamp = nowIso();
    const post: Post = {
      ...draft,
      id: nextId(posts),
      created_at: timestamp,
      updated_at: timestamp,
    };
    writeAll([post, ...posts]);
    return post;
  },

  async update(id: number, draft: PostDraft): Promise<Post | undefined> {
    const posts = readAll();
    const index = posts.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    const updated: Post = {
      ...posts[index],
      ...draft,
      id,
      updated_at: nowIso(),
    };
    posts[index] = updated;
    writeAll(posts);
    return updated;
  },

  async remove(id: number): Promise<void> {
    writeAll(readAll().filter((p) => p.id !== id));
  },

  /** Útil em desenvolvimento: limpa e re-semeia. */
  async reset(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    readAll();
  },
};
