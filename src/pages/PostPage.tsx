import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PostContent } from '../components/PostContent';
import { TableOfContents } from '../components/TableOfContents';
import { api, ApiError } from '../services/api';
import { parseContent } from '../utils/toc';
import { formatLongDate } from '../utils/date';
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
  const sidebar =
    parsed.headings.length > 0 ? (
      <TableOfContents headings={parsed.headings} title={tocTitle} />
    ) : undefined;

  return (
    <Layout sidebar={sidebar}>
      <article className="post">
        <Link to="/" className="back-link">
          ← {post.language === 'pt' ? 'Voltar' : 'Back'}
        </Link>

        <header className="post__header">
          <h1 className="post__title">{post.title}</h1>
          <div className="post__meta">
            {post.published_at && (
              <time dateTime={post.published_at}>
                {formatLongDate(post.published_at, post.language)}
              </time>
            )}
            <span className="post__lang">{post.language.toUpperCase()}</span>
          </div>
          {post.tags.length > 0 && (
            <ul className="post__tags">
              {post.tags.map((tag) => (
                <li key={tag} className="post__tag">#{tag}</li>
              ))}
            </ul>
          )}
        </header>

        <PostContent html={parsed.html} />

        <footer className="post__footer">
          <Link to="/" className="back-link">
            ← {post.language === 'pt' ? 'Voltar para a home' : 'Back to home'}
          </Link>
        </footer>
      </article>
    </Layout>
  );
}
