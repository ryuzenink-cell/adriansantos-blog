import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PostContent } from '../components/PostContent';
import { TableOfContents } from '../components/TableOfContents';
import { api, ApiError } from '../services/api';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { parseContent } from '../utils/toc';
import { formatLongDate } from '../utils/date';
import { datesDiffer, estimateReadingMinutes } from '../utils/reading';
import type { Post } from '../types';

/** Página de um post: /posts/:slug — busca no D1 via /api/public/post. */
export function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setNotFound(false);
    api
      .getPublicPost(slug)
      .then((p) => active && setPost(p))
      .catch((e) => {
        if (!active) return;
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        else setNotFound(true);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  // Injeta ids nos headings e extrai o sumário.
  const parsed = useMemo(
    () => (post ? parseContent(post.content_html) : { html: '', headings: [] }),
    [post],
  );

  // Mantém title/description/canonical coerentes em navegações client-side
  // (chegar aqui via link da SPA, sem passar pelo SSR de functions/posts/[slug].ts).
  useDocumentMeta({
    title: post ? `${post.title} | Adrian Santos` : 'AdrianSantos.blog',
    description: post?.excerpt || undefined,
    canonicalPath: post ? `/posts/${post.slug}` : undefined,
    language: post?.language,
    type: 'article',
  });

  if (loading) {
    return (
      <Layout>
        <p className="archive__empty">Loading…</p>
      </Layout>
    );
  }

  if (notFound || !post) {
    return (
      <Layout>
        <article className="prose prose--page">
          <h1>Post not found</h1>
          <p>The post you're looking for doesn't exist or was unpublished.</p>
          <p>
            <Link to="/" className="back-link">← Back to home</Link>
          </p>
        </article>
      </Layout>
    );
  }

  const tocTitle = post.language === 'pt' ? 'Nesta página' : 'On this page';
  const isPt = post.language === 'pt';
  const readingMinutes = estimateReadingMinutes(post.content_html, post.language);
  const showUpdated = datesDiffer(post.published_at, post.updated_at);
  const sidebar =
    parsed.headings.length > 0 ? (
      <TableOfContents headings={parsed.headings} title={tocTitle} />
    ) : undefined;

  return (
    <Layout sidebar={sidebar} language={post.language}>
      <article className="post">
        <Link to="/" className="back-link">
          ← {isPt ? 'Voltar' : 'Back'}
        </Link>

        <header className="post__header">
          <h1 className="post__title">{post.title}</h1>
          {post.excerpt && <p className="post__excerpt">{post.excerpt}</p>}
          <div className="post__meta" aria-label={isPt ? 'Informações do artigo' : 'Article details'}>
            {post.published_at && (
              <time dateTime={post.published_at}>
                {formatLongDate(post.published_at, post.language)}
              </time>
            )}
            <span className="post__lang">{post.language.toUpperCase()}</span>
            <span>{isPt ? `${readingMinutes} min de leitura` : `${readingMinutes} min read`}</span>
            {showUpdated && (
              <span>
                {isPt ? 'Atualizado em ' : 'Updated '}
                <time dateTime={post.updated_at}>{formatLongDate(post.updated_at, post.language)}</time>
              </span>
            )}
          </div>
          {post.tags.length > 0 && (
            <ul className="post__tags" aria-label={isPt ? 'Tópicos' : 'Topics'}>
              {post.tags.map((tag) => (
                <li key={tag} className="post__tag">#{tag}</li>
              ))}
            </ul>
          )}
        </header>

        <PostContent html={parsed.html} />

        <footer className="post__footer">
          <p className="post__footer-title">{isPt ? 'Continue explorando' : 'Keep exploring'}</p>
          <p className="post__footer-copy">
            {isPt
              ? 'Veja outros artigos técnicos ou procure um tópico específico.'
              : 'Read more technical articles or look for a specific topic.'}
          </p>
          <nav className="post__footer-links" aria-label={isPt ? 'Próximos passos' : 'Next steps'}>
            <Link to="/">← {isPt ? 'Todos os artigos' : 'All articles'}</Link>
            <Link to="/search">{isPt ? 'Buscar no blog' : 'Search the blog'} →</Link>
          </nav>
        </footer>
      </article>
    </Layout>
  );
}
