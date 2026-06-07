// Tipos do ambiente e do domínio no lado do servidor (Functions).

export interface Env {
  // Binding do D1 configurado no wrangler.toml / painel do Pages.
  DB: D1Database;
}

/** Linha crua da tabela posts. */
export interface PostRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content_html: string;
  language: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Post serializado para o front (null -> '', tags incluídas). */
export interface PostDTO {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  language: string;
  status: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

/** Converte uma linha do D1 em DTO, normalizando nulos. */
export function toPostDTO(row: PostRow, tags: string[] = []): PostDTO {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? '',
    content_html: row.content_html,
    language: row.language,
    status: row.status,
    published_at: row.published_at ?? '',
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags,
  };
}
