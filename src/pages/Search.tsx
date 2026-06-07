import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { usePosts, selectPublished } from '../hooks/usePosts';
import { formatLongDate } from '../utils/date';

/** Remove tags HTML para permitir busca no texto puro do conteúdo. */
function stripHtml(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, ' ');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent ?? '';
}

/**
 * Busca local simples sobre título, excerpt e conteúdo dos posts publicados.
 * A query vem da URL (?q=) e pode ser refinada no campo desta página.
 */
export function Search() {
  const { posts } = usePosts();
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);

  const published = useMemo(() => selectPublished(posts), [posts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return published.filter((post) => {
      const haystack = [
        post.title,
        post.excerpt,
        stripHtml(post.content_html),
        post.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [published, query]);

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
            placeholder="Search posts by title, excerpt or content…"
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
