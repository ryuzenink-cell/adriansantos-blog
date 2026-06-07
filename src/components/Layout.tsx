import type { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  /** Conteúdo opcional da coluna lateral direita (ex.: sumário). */
  sidebar?: ReactNode;
}

/**
 * Layout público: header fixo no topo, conteúdo central com largura máxima
 * e uma sidebar opcional à direita (visível só no desktop).
 */
export function Layout({ children, sidebar }: LayoutProps) {
  return (
    <div className="page">
      <Header />
      <div className={`page__body${sidebar ? ' page__body--with-sidebar' : ''}`}>
        <main className="page__main">{children}</main>
        {sidebar && <aside className="page__sidebar">{sidebar}</aside>}
      </div>
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Adrian Santos · Built with Vite + React</p>
      </footer>
    </div>
  );
}
