import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError, type SessionUser } from '../services/api';

// ============================================================================
// Autenticação baseada em sessão do backend (cookie HttpOnly).
//
// NÃO há credenciais no front nem token em localStorage. O estado de "logado"
// é descoberto perguntando ao servidor (GET /api/auth/me) na inicialização.
// A proteção real é server-side; aqui é apenas UX/roteamento.
// ============================================================================

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica a sessão atual ao montar.
  useEffect(() => {
    let active = true;
    api
      .me()
      .then((u) => active && setUser(u))
      .catch((e) => {
        // 401 = sem sessão (esperado). Outros erros: também tratamos como deslogado.
        if (!(e instanceof ApiError)) console.error(e);
        if (active) setUser(null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await api.login(username, password);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
