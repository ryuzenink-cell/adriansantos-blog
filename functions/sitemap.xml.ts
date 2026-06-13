import type { Env } from './_lib/db';

// ============================================================================
// /sitemap.xml — gerado dinamicamente a partir do Cloudflare D1.
//
// Pages Functions: o arquivo `functions/sitemap.xml.ts` responde na rota
// `/sitemap.xml` (a extensão .ts é removida do caminho). As Functions têm
// precedência sobre o fallback SPA do _redirects, então isto sempre vence.
//
// Estrutura real das rotas públicas do projeto (ver src/App.tsx):
//   /            -> home
//   /about       -> página About
//   /posts/:slug -> post individual (um slug por post; idioma é um campo,
//                   NÃO há prefixo /en ou /pt-br nas URLs)
//
// Só entram posts com status = 'published'. Rotas /admin, /api etc. ficam fora.
// ============================================================================

const SITE = 'https://adriansantos.blog';

interface SitemapRow {
  slug: string;
  updated_at: string | null;
  published_at: string | null;
  created_at: string | null;
}

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
}

/** Escapa os 5 caracteres especiais do XML. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Primeira data válida -> 'YYYY-MM-DD'. Se nenhuma for confiável, undefined. */
function toLastmod(...candidates: (string | null | undefined)[]): string | undefined {
  for (const c of candidates) {
    if (!c) continue;
    // Aceita ISO ('2026-06-06T10:00:00.000Z') e 'YYYY-MM-DD HH:MM:SS' do D1.
    const normalized = c.includes('T') ? c : c.replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return undefined;
}

function renderUrl({ loc, lastmod, changefreq, priority }: UrlEntry): string {
  const parts = [`    <loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  parts.push(`    <changefreq>${changefreq}</changefreq>`);
  parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let posts: SitemapRow[] = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, updated_at, published_at, created_at
         FROM posts
        WHERE status = 'published'
        ORDER BY COALESCE(published_at, created_at) DESC`,
    ).all<SitemapRow>();
    posts = results;
  } catch {
    // Se o banco falhar, ainda devolvemos o sitemap das páginas estáticas.
    posts = [];
  }

  // lastmod da home = data do post mais recente (se houver).
  const homeLastmod = posts.length
    ? toLastmod(posts[0].updated_at, posts[0].published_at, posts[0].created_at)
    : undefined;

  const urls: UrlEntry[] = [
    { loc: `${SITE}/`, lastmod: homeLastmod, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE}/about`, changefreq: 'monthly', priority: '0.8' },
  ];

  for (const post of posts) {
    if (!post.slug) continue;
    urls.push({
      loc: `${SITE}/posts/${post.slug}`,
      lastmod: toLastmod(post.updated_at, post.published_at, post.created_at),
      changefreq: 'monthly',
      priority: '0.7',
    });
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(renderUrl).join('\n') +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // Cache leve no edge; posts novos aparecem em até 1h.
      'cache-control': 'public, max-age=3600',
    },
  });
};
