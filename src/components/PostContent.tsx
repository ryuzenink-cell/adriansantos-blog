import { sanitizeHtml } from '../utils/sanitize';

interface PostContentProps {
  /** HTML já processado (ids de heading injetados por parseContent). */
  html: string;
}

/**
 * Renderiza o corpo do post. O HTML passa pelo sanitizador antes de ir para
 * dangerouslySetInnerHTML. A tipografia de leitura vem da classe .prose.
 */
export function PostContent({ html }: PostContentProps) {
  return (
    <div
      className="prose"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
