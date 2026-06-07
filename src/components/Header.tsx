import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

// Link do GitHub do autor.
const GITHUB_URL = 'https://github.com/ryuzenink-cell';

/** Cabeçalho público: nome do site à esquerda, navegação à direita. */
export function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-brand">
          AdrianSantos.blog
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <Link to="/about" className="site-nav__link">
            About
          </Link>
          <a
            href={GITHUB_URL}
            className="site-nav__link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            title="GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.05.78 2.12 0 1.53-.01 2.77-.01 3.15 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
            </svg>
          </a>

          <form className="site-search" role="search" onSubmit={submitSearch}>
            <input
              type="search"
              className="site-search__input"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search posts"
            />
          </form>

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
