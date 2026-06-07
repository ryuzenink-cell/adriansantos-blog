// Cliente HTTP do front-end para as Pages Functions.
//
// Todas as chamadas usam `credentials: 'include'` para enviar/receber o cookie
// de sessão HttpOnly. NÃO há token manipulado em JS nem nada em localStorage —
// a sessão é controlada inteiramente pelo cookie gerenciado pelo backend.

import type { Post, PostDraft } from '../types';

export interface SessionUser {
  id: number;
  username: string;
  role: string;
}

/** Erro de API com status HTTP, para o front reagir (ex.: 401). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* corpo não-JSON */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // ---- Público ----
  getPublicPosts: () => request<Post[]>('/api/public/posts'),
  getPublicPost: (slug: string) =>
    request<Post>(`/api/public/post?slug=${encodeURIComponent(slug)}`),

  // ---- Auth ----
  login: (username: string, password: string) =>
    request<SessionUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<SessionUser>('/api/auth/me'),

  // ---- Admin posts ----
  listPosts: () => request<Post[]>('/api/posts'),
  getPost: (id: number) => request<Post>(`/api/posts/${id}`),
  createPost: (draft: PostDraft) =>
    request<Post>('/api/posts', { method: 'POST', body: JSON.stringify(draft) }),
  updatePost: (id: number, draft: PostDraft) =>
    request<Post>(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify(draft) }),
  deletePost: (id: number) =>
    request<{ ok: true }>(`/api/posts/${id}`, { method: 'DELETE' }),
};
