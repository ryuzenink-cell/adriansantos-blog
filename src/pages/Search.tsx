import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { formatLongDate } from '../utils/date';
import {
  getLanguagePreference,
  preferenceAfterSelection,
  saveLanguagePreference,
  type LanguageFilter,
  type LanguagePreference,
} from '../utils/languagePreference';
import type { Post } from '../types';

const COPY = {
  en: {
    title: 'Search',
    placeholder: 'Search by title, summary, tag, or language',
    inputLabel: 'Search articles',
    button: 'Search',
    filterLabel: 'Filter search by language',
    all: 'All',
    portuguese: 'Portuguese',
    english: 'English',
    loading: 'Loading articles...',
    error: 'The articles could not be loaded. Please try again in a moment.',
    start: 'Enter a term to search the published articles.',
    noResults: 'No results for',
    oneResult: '1 result for',
    manyResults: 'results for',
  },
  pt: {
    title: 'Busca',
    placeholder: 'Busque por título, resumo, tag ou idioma',
    inputLabel: 'Buscar artigos',
    button: 'Buscar',
    filterLabel: 'Filtrar busca por idioma',
    all: 'Todos',
    portuguese: 'Português',
    english: 'English',
    loading: 'Carregando artigos...',
    error: 'Não foi possível carregar os artigos. Tente novamente em instantes.',
    start: 'Digite um termo para pesquisar nos artigos publicados.',
    noResults: 'Nenhum resultado para',
    oneResult: '1 resultado para',
    manyResults: 'resultados para',
  },
};

function searchableLanguage(post: Post): string {
  return post.language === 'pt' ? 'pt português portuguese' : 'en english inglês ingles';
}

export function Search() {
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const [query, setQuery] = useState(urlQuery);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [preference, setPreference] = useState<LanguagePreference>(getLanguagePreference);
  const copy = COPY[preference.interfaceLanguage];

  useDocumentMeta({
    title: `${copy.title} | AdrianSantos.blog`,
    description: preference.interfaceLanguage === 'pt'
      ? 'Busque artigos por título, resumo, idioma ou tags no AdrianSantos.blog.'
      : 'Search AdrianSantos.blog articles by title, summary, language, or tags.',
    canonicalPath: '/search',
    language: preference.interfaceLanguage,
  });

  useEffect(() => setQuery(urlQuery), [urlQuery]);

  useEffect(() => {
    let active = true;
    api
      .getPublicPosts()
      .then((loadedPosts) => active && setPosts(loadedPosts))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return [];
    return posts.filter((post) => {
      if (preference.filter !== 'all' && post.language !== preference.filter) return false;
      const searchable = [
        post.title,
        post.excerpt,
        post.tags.join(' '),
        searchableLanguage(post),
      ].join(' ').toLocaleLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [posts, preference.filter, query]);

  const changeLanguage = (filter: LanguageFilter) => {
    const next = preferenceAfterSelection(preference, filter);
    setPreference(next);
    saveLanguagePreference(next);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextQuery = query.trim();
    setParams(nextQuery ? { q: nextQuery } : {});
  };

  const trimmed = query.trim();
  const resultSummary = results.length === 1
    ? `${copy.oneResult} “${trimmed}”`
    : `${results.length} ${copy.manyResults} “${trimmed}”`;

  return (
    <Layout language={preference.interfaceLanguage}>
      <div className="search">
        <header className="search__header">
          <h1 className="search__title">{copy.title}</h1>
        </header>

        <form className="search__form" role="search" onSubmit={onSubmit}>
          <label className="visually-hidden" htmlFor="article-search">{copy.inputLabel}</label>
          <input
            id="article-search"
            type="search"
            className="search__input"
            value={query}
            autoFocus
            placeholder={copy.placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn btn--primary">{copy.button}</button>
        </form>

        <div className="language-filter language-filter--search" role="group" aria-label={copy.filterLabel}>
          {(['all', 'pt', 'en'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={`language-filter__button${preference.filter === filter ? ' language-filter__button--active' : ''}`}
              aria-pressed={preference.filter === filter}
              onClick={() => changeLanguage(filter)}
            >
              {filter === 'all' ? copy.all : filter === 'pt' ? copy.portuguese : copy.english}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="search__state" role="status">{copy.loading}</p>
        ) : error ? (
          <p className="search__state search__state--error" role="alert">{copy.error}</p>
        ) : trimmed === '' ? (
          <p className="search__state">{copy.start}</p>
        ) : results.length === 0 ? (
          <p className="search__state">{copy.noResults} “{trimmed}”.</p>
        ) : (
          <>
            <p className="search__summary">{resultSummary}</p>
            <ul className="search__results">
              {results.map((post) => (
                <li key={post.id} className="search__result">
                  <div className="search__result-meta">
                    {post.published_at && (
                      <time dateTime={post.published_at}>{formatLongDate(post.published_at, preference.interfaceLanguage)}</time>
                    )}
                    <span className="post__lang">{post.language.toUpperCase()}</span>
                  </div>
                  <Link to={`/posts/${post.slug}`} className="search__result-title">
                    {post.title}
                  </Link>
                  {post.excerpt && <p className="search__result-excerpt">{post.excerpt}</p>}
                  {post.tags.length > 0 && (
                    <ul className="post__tags post__tags--compact" aria-label="Tags">
                      {post.tags.slice(0, 4).map((tag) => <li key={tag} className="post__tag">#{tag}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Layout>
  );
}
