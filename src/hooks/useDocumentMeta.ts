import { useEffect } from 'react';

const SITE_URL = 'https://adriansantos.blog';

export interface DocumentMeta {
  title: string;
  description?: string;
  /** Caminho absoluto (ex.: '/about'). Vira URL absoluta para o canonical. */
  canonicalPath?: string;
}

function setMetaDescription(content: string) {
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(path: string) {
  let tag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', `${SITE_URL}${path}`);
}

/**
 * Atualiza document.title, meta[name=description] e link[rel=canonical] em
 * navegações internas da SPA (React Router não recarrega a página, então
 * esses elementos ficariam presos no valor do index.html estático).
 *
 * Não substitui o SSR dos posts (functions/posts/[slug].ts) — serve para
 * manter as demais páginas (Home, About, Search) e a navegação client-side
 * até um post coerentes durante a sessão.
 */
export function useDocumentMeta({ title, description, canonicalPath }: DocumentMeta): void {
  useEffect(() => {
    document.title = title;
    if (description) setMetaDescription(description);
    if (canonicalPath) setCanonical(canonicalPath);
  }, [title, description, canonicalPath]);
}
