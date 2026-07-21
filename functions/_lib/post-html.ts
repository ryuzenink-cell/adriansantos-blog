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
  escapeAttr,
  escapeHtml,
  formatDisplayDate,
  htmlLang,
  ogLocale,
  postUrl,
  safeJsonLd,
} from './seo';

/** Marca o #root como já renderizado no servidor, para o main.tsx não montar o React por cima. */
const SERVER_RENDER_ATTR = 'data-render-mode';
const SERVER_RENDER_VALUE = 'server-post';

function renderTagsHtml(tags: string[]): string {
  if (tags.length === 0) return '';
  const items = tags.map((tag) => `<li class="post__tag">#${escapeHtml(tag)}</li>`).join('');
  return `<ul class="post__tags">${items}</ul>`;
}

function renderPostArticle(post: PostDTO): string {
  const isPt = post.language === 'pt';
  const backLabel = isPt ? 'Voltar' : 'Back';
  const backLabelFull = isPt ? 'Voltar para a home' : 'Back to home';
  const displayDate = post.published_at ? formatDisplayDate(post.published_at, post.language) : '';

  const metaParts: string[] = [];
  if (post.published_at) {
    metaParts.push(
      `<time datetime="${escapeAttr(post.published_at)}">${escapeHtml(displayDate)}</time>`,
    );
  }
  metaParts.push(`<span class="post__lang">${escapeHtml(post.language.toUpperCase())}</span>`);

  // Defesa adicional: o content_html já é sanitizado na gravação (ver
  // functions/api/posts), mas sanitizamos de novo aqui antes de embutir no HTML.
  const contentHtml = sanitizeHtml(post.content_html);

  return (
    `<div class="page">` +
    `<header class="site-header"><div class="site-header__inner">` +
    `<a href="/" class="site-brand">${escapeHtml(SITE_NAME)}</a>` +
    `<nav class="site-nav site-nav--desktop" aria-label="Primary">` +
    `<a href="/about" class="site-nav__link">About</a>` +
    `<a href="/search" class="site-nav__link">Search</a>` +
    `</nav></div></header>` +
    `<div class="page__body"><main class="page__main">` +
    `<article class="post">` +
    `<a href="/" class="back-link">← ${escapeHtml(backLabel)}</a>` +
    `<header class="post__header">` +
    `<h1 class="post__title">${escapeHtml(post.title)}</h1>` +
    `<div class="post__meta">${metaParts.join('')}</div>` +
    renderTagsHtml(post.tags) +
    `</header>` +
    `<div class="prose post-content">${contentHtml}</div>` +
    `<footer class="post__footer">` +
    `<a href="/" class="back-link">← ${escapeHtml(backLabelFull)}</a>` +
    `</footer>` +
    `</article>` +
    `</main></div>` +
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
