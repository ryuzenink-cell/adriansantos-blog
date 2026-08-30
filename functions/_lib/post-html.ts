// ============================================================================
// Renderização server-side dos posts (SEO + conteúdo no HTML inicial).
//
// Estratégia: busca o index.html compilado (fetchIndexShell) e o transforma
// com HTMLRewriter, substituindo apenas <title>/<meta description>/<html lang>
// e o conteúdo de #root — todo o resto do documento (CSS, favicon, manifest,
// GA, PWA) é preservado como veio do build.
// ============================================================================

import type { PostDTO } from './db';
import { sanitizeHtml } from './sanitize';
import {
  AUTHOR_NAME,
  SITE_NAME,
  buildDescription,
  datesDiffer,
  estimateReadingMinutes,
  escapeAttr,
  escapeHtml,
  formatDisplayDate,
  htmlLang,
  ogLocale,
  postUrl,
  safeJsonLd,
  stripHtml,
} from './seo';
import { slugify } from './slugify';

/** Marca o #root como já renderizado no servidor, para o main.tsx não montar o React por cima. */
const SERVER_RENDER_ATTR = 'data-render-mode';
const SERVER_RENDER_VALUE = 'server-post';

function renderTagsHtml(tags: string[]): string {
  if (tags.length === 0) return '';
  const items = tags.map((tag) => `<li class="post__tag">#${escapeHtml(tag)}</li>`).join('');
  return `<ul class="post__tags">${items}</ul>`;
}

interface ServerHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function addHeadingAnchors(html: string): { html: string; headings: ServerHeading[] } {
  const headings: ServerHeading[] = [];
  const used = new Set<string>();
  const anchoredHtml = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/gi, (_match, rawLevel: string, inner: string) => {
    const text = stripHtml(inner);
    if (!text) return _match;
    const baseId = slugify(text) || 'section';
    let id = baseId;
    let suffix = 2;
    while (used.has(id)) id = `${baseId}-${suffix++}`;
    used.add(id);
    const level = Number(rawLevel) as 2 | 3;
    headings.push({ id, text, level });
    return `<h${level} id="${escapeAttr(id)}">${inner}</h${level}>`;
  });
  return { html: anchoredHtml, headings };
}

function renderServerToc(headings: ServerHeading[], title: string): string {
  if (headings.length === 0) return '';
  const items = headings.map((heading) => (
    `<li class="toc__item toc__item--h${heading.level}">` +
    `<a href="#${escapeAttr(heading.id)}">${escapeHtml(heading.text)}</a></li>`
  )).join('');
  return `<aside class="page__sidebar"><nav class="toc" aria-label="${escapeAttr(title)}">` +
    `<p class="toc__title">${escapeHtml(title)}</p><ul class="toc__list">${items}</ul>` +
    `</nav></aside>`;
}

function renderPostArticle(post: PostDTO): string {
  const isPt = post.language === 'pt';
  const backLabel = isPt ? 'Voltar' : 'Back';
  const tocTitle = isPt ? 'Nesta página' : 'On this page';
  const displayDate = post.published_at ? formatDisplayDate(post.published_at, post.language) : '';
  const readingMinutes = estimateReadingMinutes(post.content_html, post.language);
  const readingLabel = isPt ? `${readingMinutes} min de leitura` : `${readingMinutes} min read`;
  const showUpdated = datesDiffer(post.published_at, post.updated_at);

  const metaParts: string[] = [];
  if (post.published_at) {
    metaParts.push(
      `<span><time datetime="${escapeAttr(post.published_at)}">${escapeHtml(displayDate)}</time></span>`,
    );
  }
  metaParts.push(`<span class="post__lang">${escapeHtml(post.language.toUpperCase())}</span>`);
  metaParts.push(`<span>${escapeHtml(readingLabel)}</span>`);
  if (showUpdated) {
    const updatedDate = formatDisplayDate(post.updated_at, post.language);
    const prefix = isPt ? 'Atualizado em ' : 'Updated ';
    metaParts.push(
      `<span>${escapeHtml(prefix)}<time datetime="${escapeAttr(post.updated_at)}">${escapeHtml(updatedDate)}</time></span>`,
    );
  }

  // Defesa adicional: o content_html já é sanitizado na gravação (ver
  // functions/api/posts), mas sanitizamos de novo aqui antes de embutir no HTML.
  const parsedContent = addHeadingAnchors(sanitizeHtml(post.content_html));
  const hasSidebar = parsedContent.headings.length > 0;
  const homeLabel = isPt ? 'Todos os artigos' : 'All articles';
  const searchLabel = isPt ? 'Buscar no blog' : 'Search the blog';
  const footerTitle = isPt ? 'Continue explorando' : 'Keep exploring';
  const footerCopy = isPt
    ? 'Veja outros artigos técnicos ou procure um tópico específico.'
    : 'Read more technical articles or look for a specific topic.';

  return (
    `<div class="page">` +
    `<header class="site-header"><div class="site-header__inner">` +
    `<a href="/" class="site-brand">${escapeHtml(SITE_NAME)}</a>` +
    `<nav class="site-nav site-nav--server" aria-label="Primary">` +
    `<a href="/about" class="site-nav__link">About</a>` +
    `<a href="/search" class="site-nav__link">${isPt ? 'Busca' : 'Search'}</a>` +
    `</nav></div></header>` +
    `<div class="page__body${hasSidebar ? ' page__body--with-sidebar' : ''}"><main class="page__main">` +
    `<article class="post">` +
    `<a href="/" class="back-link">← ${escapeHtml(backLabel)}</a>` +
    `<header class="post__header">` +
    `<h1 class="post__title">${escapeHtml(post.title)}</h1>` +
    (post.excerpt ? `<p class="post__excerpt">${escapeHtml(post.excerpt)}</p>` : '') +
    `<div class="post__meta" aria-label="${isPt ? 'Informações do artigo' : 'Article details'}">${metaParts.join('')}</div>` +
    renderTagsHtml(post.tags) +
    `</header>` +
    `<div class="prose post-content">${parsedContent.html}</div>` +
    `<footer class="post__footer">` +
    `<p class="post__footer-title">${escapeHtml(footerTitle)}</p>` +
    `<p class="post__footer-copy">${escapeHtml(footerCopy)}</p>` +
    `<nav class="post__footer-links" aria-label="${isPt ? 'Próximos passos' : 'Next steps'}">` +
    `<a href="/">← ${escapeHtml(homeLabel)}</a>` +
    `<a href="/search">${escapeHtml(searchLabel)} →</a></nav>` +
    `</footer>` +
    `</article>` +
    `</main>${renderServerToc(parsedContent.headings, tocTitle)}</div>` +
    `<footer class="site-footer"><p>© ${new Date().getFullYear()} ${escapeHtml(AUTHOR_NAME)} · Built with Vite + React</p></footer>` +
    `</div>`
  );
}

function buildJsonLd(post: PostDTO, canonical: string, description: string): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    inLanguage: htmlLang(post.language),
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: { '@type': 'Person', name: AUTHOR_NAME },
    publisher: { '@type': 'Person', name: AUTHOR_NAME },
  };
  if (post.published_at) jsonLd.datePublished = post.published_at;
  if (post.updated_at) jsonLd.dateModified = post.updated_at;
  return jsonLd;
}

function buildHeadExtras(post: PostDTO, canonical: string, description: string): string {
  const locale = ogLocale(post.language);
  const parts = [
    `<link rel="canonical" href="${escapeAttr(canonical)}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${escapeAttr(post.title)}">`,
    `<meta property="og:description" content="${escapeAttr(description)}">`,
    `<meta property="og:url" content="${escapeAttr(canonical)}">`,
    `<meta property="og:site_name" content="${escapeAttr(SITE_NAME)}">`,
    `<meta property="og:locale" content="${locale}">`,
  ];
  if (post.published_at) {
    parts.push(`<meta property="article:published_time" content="${escapeAttr(post.published_at)}">`);
  }
  if (post.updated_at) {
    parts.push(`<meta property="article:modified_time" content="${escapeAttr(post.updated_at)}">`);
  }
  parts.push(
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeAttr(post.title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(description)}">`,
    `<script type="application/ld+json">${safeJsonLd(buildJsonLd(post, canonical, description))}</script>`,
  );
  return parts.join('');
}

/** Transforma o index.html compilado em uma página completa do post (SSR). */
export function renderPostDocument(shell: Response, post: PostDTO): Response {
  const canonical = postUrl(post.slug);
  const description = buildDescription(post);
  const fullTitle = `${post.title} | ${AUTHOR_NAME}`;
  const headExtras = buildHeadExtras(post, canonical, description);
  const articleHtml = renderPostArticle(post);

  const rewriter = new HTMLRewriter()
    .on('html', {
      element(el) {
        el.setAttribute('lang', htmlLang(post.language));
      },
    })
    .on('title', {
      element(el) {
        el.setInnerContent(fullTitle);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', description);
      },
    })
    .on('head', {
      element(el) {
        el.append(headExtras, { html: true });
      },
    })
    .on('#root', {
      element(el) {
        el.setAttribute(SERVER_RENDER_ATTR, SERVER_RENDER_VALUE);
        el.setInnerContent(articleHtml, { html: true });
      },
    });

  const transformed = rewriter.transform(shell);
  return new Response(transformed.body, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Conteúdo dinâmico (D1): evita edge/browser cache servindo posts desatualizados.
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}

export interface ErrorPageOptions {
  status: 404 | 500 | 503;
  title: string;
  heading: string;
  message: string;
}

function renderErrorArticle({ heading, message }: ErrorPageOptions): string {
  return (
    `<div class="page">` +
    `<header class="site-header"><div class="site-header__inner">` +
    `<a href="/" class="site-brand">${escapeHtml(SITE_NAME)}</a>` +
    `</div></header>` +
    `<div class="page__body"><main class="page__main">` +
    `<article class="prose prose--page">` +
    `<h1>${escapeHtml(heading)}</h1>` +
    `<p>${escapeHtml(message)}</p>` +
    `<p><a href="/" class="back-link">← Back to home</a></p>` +
    `</article>` +
    `</main></div>` +
    `</div>`
  );
}

/** Transforma o index.html compilado em uma página de erro (404/500/503), sem depender de JS. */
export function renderErrorDocument(shell: Response, options: ErrorPageOptions): Response {
  const articleHtml = renderErrorArticle(options);

  const rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(options.title);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', options.message);
      },
    })
    .on('head', {
      element(el) {
        el.append('<meta name="robots" content="noindex">', { html: true });
      },
    })
    .on('#root', {
      element(el) {
        el.setAttribute(SERVER_RENDER_ATTR, SERVER_RENDER_VALUE);
        el.setInnerContent(articleHtml, { html: true });
      },
    });

  const transformed = rewriter.transform(shell);
  return new Response(transformed.body, {
    status: options.status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}

/** Página de erro mínima e segura, para quando nem o shell (ASSETS) está disponível. */
export function renderFallbackErrorPage(options: ErrorPageOptions): Response {
  const html =
    `<!doctype html><html lang="en"><head><meta charset="UTF-8">` +
    `<title>${escapeHtml(options.title)}</title>` +
    `<meta name="robots" content="noindex"></head><body>` +
    renderErrorArticle(options) +
    `</body></html>`;
  return new Response(html, {
    status: options.status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}
