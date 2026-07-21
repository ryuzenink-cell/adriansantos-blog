import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Envia um evento `page_view` manual do GA4 a cada troca de rota dentro da
 * SPA (React Router não recarrega a página, então o gtag.js não vê essas
 * navegações sozinho).
 *
 * - Pula o primeiro render: o `gtag('config', ...)` no <head> do index.html
 *   já envia o page_view inicial (inclusive nas páginas de post renderizadas
 *   no servidor, que nem chegam a montar este componente).
 * - Ignora rotas /admin (painel administrativo não é contabilizado aqui).
 * - Nunca lança erro se o gtag estiver bloqueado/ausente.
 */
export function RouteAnalytics() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (location.pathname.startsWith('/admin')) return;

    try {
      if (typeof window.gtag !== 'function') return;
      const page_path = `${location.pathname}${location.search}`;
      window.gtag('event', 'page_view', {
        page_path,
        page_location: window.location.href,
        page_title: document.title,
      });
    } catch {
      // gtag bloqueado (ad blocker) ou indisponível — não deve quebrar a navegação.
    }
  }, [location.pathname, location.search]);

  return null;
}
