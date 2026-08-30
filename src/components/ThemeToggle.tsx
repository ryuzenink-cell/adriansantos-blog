import { useTheme } from '../hooks/useTheme';
import type { Language } from '../types';

/** Botão de alternância de tema claro/escuro (sol/lua). */
export function ThemeToggle({ language = 'en' }: { language?: Language }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = language === 'pt'
    ? (isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro')
    : (isDark ? 'Switch to light theme' : 'Switch to dark theme');

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        // Sol
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Lua
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
