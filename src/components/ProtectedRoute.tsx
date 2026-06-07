import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Protege rotas /admin. Se não houver autenticação local, redireciona para
 * /admin/login guardando a rota de origem em state.from.
 *
 * ATENÇÃO: a checagem é puramente client-side e baseada em localStorage —
 * adequada só para dev. Em produção, a proteção real deve acontecer no
 * servidor (Cloudflare Function validando o cookie de sessão). Ver useAuth.ts.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth();
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
