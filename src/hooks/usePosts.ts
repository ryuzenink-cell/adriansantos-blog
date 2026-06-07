import { useCallback, useEffect, useState } from 'react';
import type { Post, PostDraft } from '../types';
import { api } from '../services/api';

/**
 * Hook de posts do ADMIN — fala com a API real (Cloudflare D1 via Functions).
 * Não usa mais localStorage. As rotas exigem sessão (cookie HttpOnly).
 */
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPosts(await api.listPosts());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createPost = useCallback(async (draft: PostDraft) => {
    const created = await api.createPost(draft);
    await refresh();
    return created;
  }, [refresh]);

  const updatePost = useCallback(async (id: number, draft: PostDraft) => {
    const updated = await api.updatePost(id, draft);
    await refresh();
    return updated;
  }, [refresh]);

  const deletePost = useCallback(async (id: number) => {
    await api.deletePost(id);
    await refresh();
  }, [refresh]);

  // Publica/despublica reaproveitando o PUT.
  const togglePublish = useCallback(async (post: Post) => {
    const willPublish = post.status !== 'published';
    const draft: PostDraft = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content_html: post.content_html,
      language: post.language,
      tags: post.tags,
      status: willPublish ? 'published' : 'draft',
      published_at: willPublish
        ? post.published_at || new Date().toISOString()
        : post.published_at,
    };
    await api.updatePost(post.id, draft);
    await refresh();
  }, [refresh]);

  return { posts, loading, error, refresh, createPost, updatePost, deletePost, togglePublish };
}
