import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Tela de login do admin.
 *
 * DESENVOLVIMENTO LOCAL APENAS — credenciais fixas (admin / 123).
 * Ver os comentários em src/hooks/useAuth.ts sobre como trocar por
 * autenticação real (Cloudflare Function + admin_users + cookie HttpOnly).
 */
export function AdminLogin() {
  const { authenticated, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Já logado? Vai direto para o dashboard.
  if (authenticated) return <Navigate to="/admin" replace />;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(username, password)) {
      navigate('/admin', { replace: true });
    } else {
      setError('Invalid credentials.');
    }
  };

  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">Admin login</h1>
        <p className="login__note">
          Local development only. Use <code>admin</code> / <code>123</code>.
        </p>
        <form onSubmit={onSubmit}>
          {error && <p className="form-error">{error}</p>}
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn--primary btn--block">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
