import type { ReactNode } from 'react';
import { Header } from './Header';
import { getLanguagePreference } from '../utils/languagePreference';
import { PROFESSIONAL_GITHUB_URL, YOROKOBI_STUDIO_URL } from '../utils/links';
import type { Language } from '../types';

interface LayoutProps {
  children: ReactNode;
  /** Conteúdo opcional da coluna lateral direita (ex.: sumário). */
  sidebar?: ReactNode;
  sidebarClassName?: string;
  language?: Language;
}

/**
 * Layout público: header fixo no topo, conteúdo central com largura máxima
 * e uma sidebar opcional à direita (visível só no desktop).
 */
export function Layout({ children, sidebar, sidebarClassName = '', language }: LayoutProps) {
  const resolvedLanguage = language ?? getLanguagePreference().interfaceLanguage;
  const isPt = resolvedLanguage === 'pt';

  return (
    <div className="page">
      <a href="#main-content" className="skip-link">
        {isPt ? 'Pular para o conteúdo' : 'Skip to content'}
      </a>
      <Header language={resolvedLanguage} />
      <div className={`page__body${sidebar ? ' page__body--with-sidebar' : ''}`}>
        <main id="main-content" className="page__main" tabIndex={-1}>{children}</main>
        {sidebar && (
          <aside className={`page__sidebar${sidebarClassName ? ` ${sidebarClassName}` : ''}`}>
            {sidebar}
          </aside>
        )}
      </div>
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Adrian Santos</p>
        <nav className="site-footer__links" aria-label={isPt ? 'Links profissionais' : 'Professional links'}>
          <a
            href={PROFESSIONAL_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={isPt ? 'GitHub profissional de Adrian Santos (abre em uma nova aba)' : 'Adrian Santos professional GitHub profile (opens in a new tab)'}
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <a
            href={YOROKOBI_STUDIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={isPt ? 'Yorokobi Studio (abre em uma nova aba)' : 'Yorokobi Studio (opens in a new tab)'}
          >
            Yorokobi Studio <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </footer>
    </div>
  );
}
