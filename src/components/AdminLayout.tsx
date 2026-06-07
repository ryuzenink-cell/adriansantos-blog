import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Casca do painel administrativo: barra superior com navegação interna,
 * link para ver o blog público e botão de logout.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="admin__bar-inner">
          <div className="admin__nav">
            <Link to="/admin" className="admin__brand">
              Admin
            </Link>
            <NavLink to="/admin" end className="admin__link">
              Dashboard
            </NavLink>
            <NavLink to="/admin/posts" className="admin__link">
              Posts
            </NavLink>
            <NavLink to="/admin/posts/new" className="admin__link">
              New post
            </NavLink>
          </div>
          <div className="admin__actions">
            <Link to="/" className="admin__link" target="_blank" rel="noopener">
              View blog ↗
            </Link>
            <button type="button" className="btn btn--ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="admin__main">{children}</main>
    </div>
  );
}
