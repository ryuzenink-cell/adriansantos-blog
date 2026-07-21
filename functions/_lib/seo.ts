// ============================================================================
// Utilitários de SEO para as páginas renderizadas no servidor (posts, 404).
// Sem dependência de DOM — compatível com o runtime do Cloudflare Workers.
// ============================================================================

export const SITE_URL = 'https://adriansantos.blog';
export const SITE_NAME = 'AdrianSantos.blog';
export const AUTHOR_NAME = 'Adrian Santos';
export const DEFAULT_DESCRIPTION =
  'Adrian Santos Blog - notes on software engineering and personal projects.';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

/** Remove tags HTML e normaliza espaços/entidades comuns, para texto puro. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Corta o texto em até `maxLen` chars, evitando quebrar no meio de uma palavra. */
export function truncate(text: string, maxLen = 160): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  const safe = lastSpace > 60 ? cut.slice(0, lastSpace) : cut;
  return `${safe.trim()}...`;
}

/** excerpt -> content_html (texto limpo) -> descrição genérica do site. */
export function buildDescription(post: { excerpt: string; content_html: string }): string {
  const excerpt = post.excerpt.trim();
  if (excerpt) return truncate(stripHtml(excerpt));
  const fromContent = stripHtml(post.content_html);
  if (fromContent) return truncate(fromContent);
  return DEFAULT_DESCRIPTION;
}

export function postUrl(slug: string): string {
  return `${SITE_URL}/posts/${encodeURIComponent(slug)}`;
}

export function ogLocale(language: string): string {
  return language === 'pt' ? 'pt_BR' : 'en_US';
}

export function htmlLang(language: string): string {
  return language === 'pt' ? 'pt-BR' : 'en';
}

// U+2028 (LINE SEPARATOR) e U+2029 (PARAGRAPH SEPARATOR) são JSON válidos mas
// JS inválido dentro de <script> — precisam ser escapados manualmente.
const LINE_SEPARATOR = String.fromCharCode(8232);
const PARAGRAPH_SEPARATOR = String.fromCharCode(8233);

/** Serializa JSON com segurança para embutir em <script type="application/ld+json">. */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .split('<').join('\\u003c')
    .split('>').join('\\u003e')
    .split('&').join('\\u0026')
    .split(LINE_SEPARATOR).join('\\u2028')
    .split(PARAGRAPH_SEPARATOR).join('\\u2029');
}

type Language = 'en' | 'pt';

const MONTHS: Record<Language, string[]> = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  pt: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ],
};

function normLang(value: string): Language {
  return value === 'pt' ? 'pt' : 'en';
}

/** Ex.: "June 7, 2026" (en) ou "7 de Junho de 2026" (pt). Espelha src/utils/date.ts. */
export function formatDisplayDate(iso: string, language: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const lang = normLang(language);
  const day = d.getDate();
  const month = MONTHS[lang][d.getMonth()] ?? '';
  const year = d.getFullYear();
  return lang === 'pt' ? `${day} de ${month} de ${year}` : `${month} ${day}, ${year}`;
}
