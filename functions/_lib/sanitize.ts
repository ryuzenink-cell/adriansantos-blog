// ============================================================================
// Sanitizador de HTML server-side (allowlist), sem dependência de DOM —
// compatível com o runtime do Cloudflare Workers/Pages.
//
// O conteúdo vem do editor visual (TipTap), que já produz um HTML restrito,
// mas sanitizamos no servidor ANTES de gravar no D1 como defesa contra XSS.
// É uma camada de segurança real: o front pode ser contornado, o backend não.
//
// Estratégia: tokeniza tags/textos, mantém apenas tags e atributos da
// allowlist, bloqueia handlers on*, e URLs perigosas (javascript:, data: etc).
// ============================================================================

// Tags permitidas e seus atributos permitidos.
const ALLOWED: Record<string, string[]> = {
  p: [],
  br: [],
  h2: [],
  h3: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  a: ['href', 'target', 'rel'],
  ul: [],
  ol: [],
  li: [],
  blockquote: [],
  pre: [],
  code: [],
  img: ['src', 'alt', 'title'],
  hr: [],
};

// Tags cujo CONTEÚDO deve ser totalmente descartado.
const DROP_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed']);

const VOID_TAGS = new Set(['br', 'img', 'hr']);

function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** URL segura para href/src? Permite http(s), mailto, âncoras e relativas. */
function isSafeUrl(url: string, isImage: boolean): boolean {
  const v = url.trim();
  // Bloqueia esquemas perigosos explicitamente.
  if (/^\s*(javascript|vbscript|data|file):/i.test(v)) return false;
  if (isImage) {
    // Imagem: só http(s) ou relativa (nesta etapa não há data: nem upload).
    return /^https?:\/\//i.test(v) || v.startsWith('/');
  }
  // Links: http(s), mailto, âncora, relativa.
  return (
    /^https?:\/\//i.test(v) ||
    /^mailto:/i.test(v) ||
    v.startsWith('#') ||
    v.startsWith('/')
  );
}

function parseAttributes(raw: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase();
    const value = m[3] ?? m[4] ?? m[5] ?? '';
    attrs.set(name, value);
  }
  return attrs;
}

export function sanitizeHtml(input: string): string {
  if (!input) return '';

  let out = '';
  let dropDepth = 0; // > 0 quando dentro de uma tag com conteúdo descartável.
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;

  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(input))) {
    const [full, rawName, rawAttrs] = m;
    const tagName = rawName.toLowerCase();
    const isClosing = full.startsWith('</');

    // Texto antes desta tag.
    const text = input.slice(lastIndex, m.index);
    if (dropDepth === 0 && text) out += escapeText(text);
    lastIndex = tagRe.lastIndex;

    // Conteúdo a descartar (script/style/...).
    if (DROP_CONTENT.has(tagName)) {
      if (!isClosing && !VOID_TAGS.has(tagName)) dropDepth++;
      else if (isClosing && dropDepth > 0) dropDepth--;
      continue;
    }
    if (dropDepth > 0) continue;

    // Tag não permitida: descarta a tag (mantém o texto, já tratado acima).
    if (!ALLOWED[tagName]) continue;

    if (isClosing) {
      if (!VOID_TAGS.has(tagName)) out += `</${tagName}>`;
      continue;
    }

    // Abertura: filtra atributos pela allowlist.
    const allowedAttrs = ALLOWED[tagName];
    const attrs = parseAttributes(rawAttrs);
    let rebuilt = `<${tagName}`;

    for (const attr of allowedAttrs) {
      if (!attrs.has(attr)) continue;
      let value = attrs.get(attr)!;

      if (attr === 'href' && !isSafeUrl(value, false)) continue;
      if (attr === 'src' && !isSafeUrl(value, true)) continue;
      if (tagName === 'a' && attr === 'target' && value !== '_blank') continue;
      // rel é sempre reescrito por nós (abaixo) para evitar duplicação.
      if (tagName === 'a' && attr === 'rel') continue;

      rebuilt += ` ${attr}="${escapeAttr(value)}"`;
    }

    // Links externos sempre com rel seguro.
    if (tagName === 'a' && attrs.get('target') === '_blank') {
      rebuilt += ' rel="noopener noreferrer"';
    }

    rebuilt += VOID_TAGS.has(tagName) ? ' />' : '>';
    out += rebuilt;
  }

  // Texto após a última tag.
  const tail = input.slice(lastIndex);
  if (dropDepth === 0 && tail) out += escapeText(tail);

  return out;
}
