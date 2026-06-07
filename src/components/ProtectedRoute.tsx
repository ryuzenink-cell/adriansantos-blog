import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Protege rotas /admin no front (UX). A proteção REAL é server-side: cada
 * endpoint /api/posts valida a sessão no middleware. Aqui apenas evitamos
 * renderizar telas admin e redirecionamos para o login quando não há sessão.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="route-loading">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
