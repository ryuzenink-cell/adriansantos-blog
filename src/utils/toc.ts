import { slugify } from './slugify';

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface ParsedContent {
  /** HTML com `id` injetado em cada h2/h3, para servir de âncora. */
  html: string;
  headings: TocHeading[];
}

/**
 * Lê o content_html do post, injeta ids estáveis nos h2/h3 e devolve a lista
 * de headings para montar o sumário lateral automático.
 *
 * Sem DOM (SSR), devolve o html original e nenhum heading.
 */
export function parseContent(html: string): ParsedContent {
  if (typeof document === 'undefined') {
    return { html, headings: [] };
  }

  const container = document.createElement('div');
  container.innerHTML = html;

  const headings: TocHeading[] = [];
  const used = new Set<string>();

  container.querySelectorAll('h2, h3').forEach((el) => {
    const text = el.textContent?.trim() ?? '';
    if (!text) return;

    // Garante ids únicos mesmo com títulos repetidos.
    let id = slugify(text) || 'section';
    let suffix = 2;
    while (used.has(id)) id = `${slugify(text)}-${suffix++}`;
    used.add(id);

    el.setAttribute('id', id);
    headings.push({
      id,
      text,
      level: el.tagName.toLowerCase() === 'h2' ? 2 : 3,
    });
  });

  return { html: container.innerHTML, headings };
}
