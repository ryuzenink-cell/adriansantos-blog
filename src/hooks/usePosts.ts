import { useCallback, useEffect, useState } from 'react';
import type { Post, PostDraft } from '../types';
import { postsRepository } from '../lib/postsRepository';

/**
 * Hook central de posts. Carrega tudo do repository e expõe operações de CRUD.
 *
 * Como o repository é assíncrono por design, este hook já lida com loading —
 * facilitando a futura troca de localStorage por chamadas às Cloudflare
 * Functions / D1 sem mexer nos componentes.
 */
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await postsRepository.list();
    setPosts(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createPost = useCallback(async (draft: PostDraft) => {
    const created = await postsRepository.create(draft);
    await refresh();
    return created;
  }, [refresh]);

  const updatePost = useCallback(async (id: number, draft: PostDraft) => {
    const updated = await postsRepository.update(id, draft);
    await refresh();
    return updated;
  }, [refresh]);

  const deletePost = useCallback(async (id: number) => {
    await postsRepository.remove(id);
    await refresh();
  }, [refresh]);

  const togglePublish = useCallback(async (post: Post) => {
    const isPublished = post.status === 'published';
    const draft: PostDraft = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content_html: post.content_html,
      language: post.language,
      tags: post.tags,
      status: isPublished ? 'draft' : 'published',
      // Ao publicar pela primeira vez, define published_at.
      published_at: isPublished
        ? post.published_at
        : post.published_at || new Date().toISOString(),
    };
    await postsRepository.update(post.id, draft);
    await refresh();
  }, [refresh]);

  return {
    posts,
    loading,
    refresh,
    createPost,
    updatePost,
    deletePost,
    togglePublish,
  };
}

/** Apenas posts publicados, opcionalmente filtrados por idioma. */
export function selectPublished(posts: Post[], language?: 'en' | 'pt'): Post[] {
  return posts.filter(
    (p) => p.status === 'published' && (!language || p.language === language),
  );
}
