// Sanitização leve de HTML antes de renderizar com dangerouslySetInnerHTML.
//
// O conteúdo dos posts é escrito pelo próprio admin (fonte confiável), então
// esta é uma camada de defesa básica, não uma blindagem completa.
//
// PRODUÇÃO: troque por uma biblioteca dedicada e battle-tested como o DOMPurify
//   import DOMPurify from 'dompurify';
//   export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html);
// e/ou sanitize no servidor (Cloudflare Function) antes de gravar no D1.

const FORBIDDEN_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'];

export function sanitizeHtml(html: string): string {
  // Sem DOM disponível (SSR/testes), devolve como está.
  if (typeof document === 'undefined') return html;

  const template = document.createElement('template');
  template.innerHTML = html;

  const walk = (node: Element) => {
    // Remove tags proibidas inteiras.
    if (FORBIDDEN_TAGS.includes(node.tagName.toLowerCase())) {
      node.remove();
      return;
    }

    // Remove atributos perigosos: handlers on* e URLs javascript:.
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on')) {
        node.removeAttribute(attr.name);
      } else if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    }

    Array.from(node.children).forEach((child) => walk(child as Element));
  };

  Array.from(template.content.children).forEach((child) => walk(child as Element));

  return template.innerHTML;
}
