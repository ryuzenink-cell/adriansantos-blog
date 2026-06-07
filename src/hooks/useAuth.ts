import { useCallback, useEffect, useState } from 'react';

/**
 * ============================================================================
 *  AUTENTICAÇÃO — APENAS PARA DESENVOLVIMENTO LOCAL. NÃO USE EM PRODUÇÃO.
 * ============================================================================
 *
 * Este "login" é um placeholder: credenciais fixas no front-end e uma flag
 * em localStorage. Isso NÃO é seguro — qualquer pessoa lê o bundle e o
 * localStorage. Serve só para destravar o desenvolvimento do painel.
 *
 * COMO SUBSTITUIR EM PRODUÇÃO:
 *   1. Criar uma Cloudflare Pages Function, ex.: POST /api/admin/login.
 *   2. A Function busca o usuário na tabela `admin_users` do D1 e compara a
 *      senha com `password_hash` usando bcrypt/scrypt/argon2 (NUNCA texto puro).
 *   3. Em caso de sucesso, emitir uma sessão assinada e gravá-la em um cookie
 *      HttpOnly + Secure + SameSite (inacessível ao JavaScript).
 *   4. Proteger as rotas /api/admin/* validando esse cookie no servidor.
 *   5. O front deixa de guardar qualquer flag; o estado de auth passa a vir
 *      de um endpoint tipo GET /api/admin/me.
 * ============================================================================
 */

const AUTH_KEY = 'admin_authenticated';

// Credenciais de teste — somente local. Remover ao integrar o D1.
const DEV_USERNAME = 'admin';
const DEV_PASSWORD = '123';

function readAuth(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function useAuth() {
  const [authenticated, setAuthenticated] = useState<boolean>(readAuth);

  // Mantém o estado em sincronia entre abas.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_KEY) setAuthenticated(readAuth());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    if (username === DEV_USERNAME && password === DEV_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      setAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
  }, []);

  return { authenticated, login, logout };
}
