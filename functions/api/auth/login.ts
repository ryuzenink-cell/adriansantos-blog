import type { Env } from '../../_lib/db';
import { json, error, readJson } from '../../_lib/http';
import {
  verifyPassword,
  generateToken,
  sha256Hex,
  buildSessionCookie,
  sessionExpiryIso,
} from '../../_lib/auth';

interface LoginBody {
  username?: string;
  password?: string;
}

interface AdminUserRow {
  id: number;
  username: string;
  password_hash: string;
  password_algorithm: string;
  role: string;
  is_active: number;
}

// Mensagem genérica — nunca revela se o usuário existe ou se a senha errou.
const GENERIC = 'Invalid username or password.';

// POST /api/auth/login
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = await readJson<LoginBody>(request);
  const username = body?.username?.trim();
  const password = body?.password ?? '';

  if (!username || !password) {
    return error('Username and password are required.', 400);
  }

  try {
    const user = await env.DB.prepare(
      `SELECT id, username, password_hash, password_algorithm, role, is_active
         FROM admin_users
        WHERE username = ?`,
    )
      .bind(username)
      .first<AdminUserRow>();

    // Resposta uniforme para usuário inexistente / inativo / senha errada.
    if (!user || user.is_active !== 1) {
      return error(GENERIC, 401);
    }

    const ok = await verifyPassword(password, user.password_hash, user.password_algorithm);
    if (!ok) {
      return error(GENERIC, 401);
    }

    // Cria sessão: guarda apenas o HASH do token no banco.
    const token = generateToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = sessionExpiryIso();

    await env.DB.prepare(
      'INSERT INTO admin_sessions (user_id, session_token_hash, expires_at) VALUES (?, ?, ?)',
    )
      .bind(user.id, tokenHash, expiresAt)
      .run();

    await env.DB.prepare('UPDATE admin_users SET last_login_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), user.id)
      .run();

    return json(
      { id: user.id, username: user.username, role: user.role },
      200,
      { 'Set-Cookie': buildSessionCookie(request, token) },
    );
  } catch (e) {
    return error('Login failed.', 500);
  }
};
