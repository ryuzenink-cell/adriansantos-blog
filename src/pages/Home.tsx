import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { PostArchive } from '../components/PostArchive';
import { usePosts, selectPublished } from '../hooks/usePosts';
import { groupPostsByMonth } from '../utils/groupPostsByMonth';
import type { Language } from '../types';

const LANG_KEY = 'adriansantos_blog_lang';

function getInitialLang(): Language {
  const saved = localStorage.getItem(LANG_KEY);
  return saved === 'pt' ? 'pt' : 'en';
}

/**
 * Home: título central, seletor de idioma PT|EN e o arquivo de posts
 * publicados agrupado por ano/mês. A sidebar lista os meses ("Nesta página").
 */
export function Home() {
  const { posts, loading } = usePosts();
  const [language, setLanguage] = useState<Language>(getInitialLang);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(LANG_KEY, lang);
  };

  const published = useMemo(
    () => selectPublished(posts, language),
    [posts, language],
  );

  const groups = useMemo(
    () => groupPostsByMonth(published, language),
    [published, language],
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
      ) : (
        <PostArchive posts={published} language={language} />
      )}
    </Layout>
  );
}
