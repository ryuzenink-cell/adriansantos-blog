import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PostArchive } from '../components/PostArchive';
import { api } from '../services/api';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { formatLongDate } from '../utils/date';
import { groupPostsByMonth } from '../utils/groupPostsByMonth';
import {
  getLanguagePreference,
  preferenceAfterSelection,
  saveLanguagePreference,
  type LanguageFilter,
  type LanguagePreference,
} from '../utils/languagePreference';
import type { Language, Post } from '../types';

const COPY = {
  en: {
    eyebrow: 'Software Engineering',
    introduction: 'Technical articles on software, study, career, and the projects that connect them.',
    latest: 'Latest articles',
    archive: 'Archive',
    onPage: 'On this page',
    all: 'All',
    loading: 'Loading articles...',
    error: 'The articles could not be loaded. Please try again in a moment.',
    empty: 'No published articles match this language yet.',
    viewAll: 'View articles in all languages',
  },
  pt: {
    eyebrow: 'Engenharia de Software',
    introduction: 'Artigos técnicos sobre software, estudos, carreira e os projetos que conectam tudo isso.',
    latest: 'Artigos recentes',
    archive: 'Arquivo',
    onPage: 'Nesta página',
    all: 'Todos',
    loading: 'Carregando artigos...',
    error: 'Não foi possível carregar os artigos. Tente novamente em instantes.',
    empty: 'Ainda não há artigos publicados neste idioma.',
    viewAll: 'Ver artigos em todos os idiomas',
  },
} satisfies Record<Language, Record<string, string>>;

export function Home() {
  const [preference, setPreference] = useState<LanguagePreference>(getLanguagePreference);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const copy = COPY[preference.interfaceLanguage];

  useDocumentMeta({
    title: 'AdrianSantos.blog',
    description: preference.interfaceLanguage === 'pt'
      ? 'Artigos técnicos de Adrian Santos sobre Engenharia de Software, estudos, carreira e projetos.'
      : 'Technical articles by Adrian Santos on software engineering, study, career, and projects.',
    canonicalPath: '/',
  });

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

  const changeLanguage = (filter: LanguageFilter) => {
    const next = preferenceAfterSelection(preference, filter);
    setPreference(next);
    saveLanguagePreference(next);
  };

  const filtered = useMemo(
    () => preference.filter === 'all'
      ? posts
      : posts.filter((post) => post.language === preference.filter),
    [posts, preference.filter],
  );
  const latest = filtered.slice(0, 4);
  const groups = useMemo(
    () => groupPostsByMonth(filtered, preference.interfaceLanguage),
    [filtered, preference.interfaceLanguage],
  );
  const counts = useMemo(() => ({
    all: posts.length,
    pt: posts.filter((post) => post.language === 'pt').length,
    en: posts.filter((post) => post.language === 'en').length,
  }), [posts]);

  const sidebar = filtered.length > 0 && (
    <nav className="toc" aria-label={copy.onPage}>
      <p className="toc__title">{copy.onPage}</p>
      <ul className="toc__list">
        <li className="toc__item toc__item--h2"><a href="#latest">{copy.latest}</a></li>
        <li className="toc__item toc__item--h2"><a href="#archive">{copy.archive}</a></li>
        {groups.map((group) => (
          <li key={group.key} className="toc__item toc__item--h3">
            <a href={`#${group.key}`}>{group.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <Layout sidebar={sidebar || undefined} sidebarClassName="page__sidebar--home">
      <section className="home-intro" aria-labelledby="home-title">
        <p className="home-intro__eyebrow">{copy.eyebrow}</p>
        <h1 id="home-title" className="home-title">Adrian Santos</h1>
        <p className="home-intro__description">{copy.introduction}</p>
      </section>

      <div className="language-filter" role="group" aria-label={preference.interfaceLanguage === 'pt' ? 'Filtrar por idioma' : 'Filter by language'}>
        {(['all', 'pt', 'en'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            className={`language-filter__button${preference.filter === filter ? ' language-filter__button--active' : ''}`}
            aria-pressed={preference.filter === filter}
            onClick={() => changeLanguage(filter)}
          >
            <span>{filter === 'all' ? copy.all : filter.toUpperCase()}</span>
            {!loading && <span className="language-filter__count">{counts[filter]}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="archive__empty" role="status">{copy.loading}</p>
      ) : error ? (
        <p className="archive__empty archive__empty--error" role="alert">{copy.error}</p>
      ) : filtered.length === 0 ? (
        <div className="archive__empty">
          <p>{copy.empty}</p>
          {preference.filter !== 'all' && (
            <button type="button" className="text-button" onClick={() => changeLanguage('all')}>
              {copy.viewAll}
            </button>
          )}
        </div>
      ) : (
        <>
          <section id="latest" className="home-section" aria-labelledby="latest-title">
            <div className="section-heading">
              <h2 id="latest-title">{copy.latest}</h2>
            </div>
            <div className="latest-list">
              {latest.map((post) => (
                <article key={post.id} className="latest-article">
                  <div className="latest-article__meta">
                    {post.published_at && <time dateTime={post.published_at}>{formatLongDate(post.published_at, preference.interfaceLanguage)}</time>}
                    <span className="post__lang">{post.language.toUpperCase()}</span>
                  </div>
                  <h3 className="latest-article__title">
                    <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                  </h3>
                  {post.excerpt && <p className="latest-article__excerpt">{post.excerpt}</p>}
                  {post.tags.length > 0 && (
                    <ul className="post__tags post__tags--compact" aria-label="Tags">
                      {post.tags.slice(0, 3).map((tag) => <li key={tag} className="post__tag">#{tag}</li>)}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section id="archive" className="home-section" aria-labelledby="archive-title">
            <div className="section-heading">
              <h2 id="archive-title">{copy.archive}</h2>
              <span>{filtered.length}</span>
            </div>
            <PostArchive
              posts={filtered}
              language={preference.interfaceLanguage}
              showLanguage={preference.filter === 'all'}
            />
          </section>
        </>
      )}
    </Layout>
  );
}
