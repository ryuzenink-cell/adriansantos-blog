import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { PostArchive } from '../components/PostArchive';
import { api } from '../services/api';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { groupPostsByMonth } from '../utils/groupPostsByMonth';
import type { Language, Post } from '../types';

const LANG_KEY = 'adriansantos_blog_lang';

function getInitialLang(): Language {
  return localStorage.getItem(LANG_KEY) === 'pt' ? 'pt' : 'en';
}

/**
 * Home: título central, seletor PT|EN e arquivo de posts publicados (do D1
 * via /api/public/posts) agrupado por ano/mês. Minimalista, sem cards.
 */
export function Home() {
  useDocumentMeta({
    title: 'AdrianSantos.blog',
    description: 'Adrian Santos Blog - notes on software engineering and personal projects.',
    canonicalPath: '/',
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(getInitialLang);

  useEffect(() => {
    let active = true;
    api
      .getPublicPosts()
      .then((p) => active && setPosts(p))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load posts.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(LANG_KEY, lang);
  };

  const filtered = useMemo(
    () => posts.filter((p) => p.language === language),
    [posts, language],
  );

  const groups = useMemo(
    () => groupPostsByMonth(filtered, language),
    [filtered, language],
  );

  const sidebarTitle = language === 'pt' ? 'Nesta página' : 'On this page';
  const sidebar = groups.length > 0 && (
    <nav className="toc" aria-label={sidebarTitle}>
      <p className="toc__title">{sidebarTitle}</p>
      <ul className="toc__list">
        {groups.map((g) => (
          <li key={g.key} className="toc__item toc__item--h2">
            <a href={`#${g.key}`}>{g.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <Layout sidebar={sidebar || undefined}>
      <div className="home-head">
        <h1 className="home-title">Adrian Santos Blog</h1>
        <div className="lang-switch" role="group" aria-label="Language">
          <button
            type="button"
            className={`lang-switch__btn${language === 'pt' ? ' lang-switch__btn--active' : ''}`}
            onClick={() => changeLanguage('pt')}
          >
            PT
          </button>
          <span className="lang-switch__sep">|</span>
          <button
            type="button"
            className={`lang-switch__btn${language === 'en' ? ' lang-switch__btn--active' : ''}`}
            onClick={() => changeLanguage('en')}
          >
            EN
          </button>
        </div>
      </div>

      {loading ? (
        <p className="archive__empty">Loading…</p>
      ) : error ? (
        <p className="archive__empty">{error}</p>
      ) : (
        <PostArchive posts={filtered} language={language} />
      )}
    </Layout>
  );
}
