import { useEffect } from 'react';
import type { Language } from '../types';

const SITE_URL = 'https://adriansantos.blog';
const SITE_NAME = 'AdrianSantos.blog';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
const DEFAULT_OG_IMAGE_ALT = 'Adrian Santos, Software Engineering, adriansantos.blog.';

export interface DocumentMeta {
  title: string;
  description?: string;
  /** Caminho absoluto (ex.: '/about'). Vira URL absoluta para o canonical. */
  canonicalPath?: string;
  language?: Language;
  type?: 'website' | 'article';
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

function setNamedMeta(name: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setPropertyMeta(property: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
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
export function useDocumentMeta({
  title,
  description,
  canonicalPath,
  language,
  type = 'website',
}: DocumentMeta): void {
  useEffect(() => {
    document.title = title;
    setPropertyMeta('og:title', title);
    setPropertyMeta('og:type', type);
    setPropertyMeta('og:site_name', SITE_NAME);
    setPropertyMeta('og:image', DEFAULT_OG_IMAGE);
    setPropertyMeta('og:image:width', '1200');
    setPropertyMeta('og:image:height', '630');
    setPropertyMeta('og:image:alt', DEFAULT_OG_IMAGE_ALT);
    setNamedMeta('twitter:card', 'summary_large_image');
    setNamedMeta('twitter:title', title);
    setNamedMeta('twitter:image', DEFAULT_OG_IMAGE);
    setNamedMeta('twitter:image:alt', DEFAULT_OG_IMAGE_ALT);

    if (description) {
      setMetaDescription(description);
      setPropertyMeta('og:description', description);
      setNamedMeta('twitter:description', description);
    }
    if (canonicalPath) {
      setCanonical(canonicalPath);
      setPropertyMeta('og:url', `${SITE_URL}${canonicalPath}`);
    }
    if (language) {
      document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
      setPropertyMeta('og:locale', language === 'pt' ? 'pt_BR' : 'en_US');
    }
  }, [title, description, canonicalPath, language, type]);
}
