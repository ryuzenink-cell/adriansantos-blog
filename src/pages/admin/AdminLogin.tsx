import { useState } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Tela de login do admin. Autentica contra a tabela admin_users do D1 via
 * POST /api/auth/login. Sem credenciais, dicas ou textos de "dev only".
 */
export function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Já autenticado? Vai para o destino pretendido ou ao dashboard.
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  if (user) return <Navigate to={from} replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username, password);
      navigate('/admin', { replace: true });
    } catch {
      // Mensagem genérica (não revela se é usuário ou senha).
      setError('Invalid username or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">Admin login</h1>
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
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
