// Tipos centrais do domínio.
//
// A estrutura do tipo Post espelha intencionalmente a tabela `posts` do
// Cloudflare D1 (ver schema.sql), acrescentando apenas `tags: string[]`,
// que no banco real virá da junção posts <-> post_tags <-> tags.
//
// Datas são strings ISO 8601 (mesmo formato que o D1 usa em TEXT), para que
// a futura migração do localStorage -> D1 não exija conversões.

export type Language = 'en' | 'pt';

export type PostStatus = 'draft' | 'published';

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  language: Language;
  status: PostStatus;
  /** ISO string. Pode ser '' enquanto for rascunho. */
  published_at: string;
  created_at: string;
  updated_at: string;
  /** No D1 isto vem de post_tags + tags; aqui guardamos só os nomes. */
  tags: string[];
}

/** Payload usado ao criar/editar no formulário do admin. */
export type PostDraft = Omit<Post, 'id' | 'created_at' | 'updated_at'>;
