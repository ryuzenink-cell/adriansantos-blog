import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { formatLongDate } from '../utils/date';
import type { Post } from '../types';

/**
 * Busca local sobre os posts publicados (título, excerpt e tags).
 * Obs.: a listagem pública não traz content_html (payload menor), então a
 * busca não cobre o corpo do texto nesta etapa.
 */
export function Search() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [posts, setPosts] = useState<Post[]>([]);

  useDocumentMeta({
    title: 'Search | AdrianSantos.blog',
    description: 'Search posts by title, excerpt or tags on AdrianSantos.blog.',
    canonicalPath: '/search',
  });

  useEffect(() => {
    let active = true;
    api.getPublicPosts().then((p) => active && setPosts(p)).catch(() => active && setPosts([]));
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return posts.filter((post) =>
      [post.title, post.excerpt, post.tags.join(' ')].join(' ').toLowerCase().includes(q),
    );
  }, [posts, query]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setParams(q ? { q } : {});
  };

  const trimmed = query.trim();

  return (
    <Layout>
      <div className="search">
        <h1 className="search__title">Search</h1>
        <form className="search__form" role="search" onSubmit={onSubmit}>
          <input
            type="search"
            className="search__input"
            value={query}
            autoFocus
            placeholder="Search posts by title, excerpt or tags…"
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search query"
          />
          <button type="submit" className="btn">Search</button>
        </form>

        {trimmed === '' ? (
          <p className="muted">Type something to search.</p>
        ) : results.length === 0 ? (
          <p className="muted">No results for “{trimmed}”.</p>
        ) : (
          <>
            <p className="muted">
              {results.length} result{results.length > 1 ? 's' : ''} for “{trimmed}”
            </p>
            <ul className="search__results">
              {results.map((post) => (
                <li key={post.id} className="search__result">
                  <Link to={`/posts/${post.slug}`} className="search__result-title">
                    {post.title}
                  </Link>
                  <div className="search__result-meta">
                    {post.published_at && (
                      <span>{formatLongDate(post.published_at, post.language)}</span>
                    )}
                    <span className="post__lang">{post.language.toUpperCase()}</span>
                  </div>
                  {post.excerpt && <p className="search__result-excerpt">{post.excerpt}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Layout>
  );
}
