// ============================================================================
// Autenticação por sessão para o painel admin.
//
// Fluxo:
//   - Senha verificada por SHA-256 (password_algorithm = 'sha256' no D1).
//   - Em login, geramos um token aleatório, guardamos o HASH dele em
//     admin_sessions e enviamos o token bruto em cookie HttpOnly.
//   - Cada request admin valida o cookie -> hash -> sessão -> usuário ativo.
//
// ⚠️ SHA-256 sem salt é fraco para senhas (vulnerável a rainbow tables).
//    EVOLUÇÃO RECOMENDADA: migrar para Argon2id, bcrypt ou PBKDF2 com salt
//    por usuário, atualizando password_algorithm e este verificador.
// ============================================================================

import type { Env } from './db';

const SESSION_COOKIE = 'session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export interface SessionUser {
  id: number;
  username: string;
  role: string;
}

const encoder = new TextEncoder();

/** SHA-256 -> hex (lowercase). Usa Web Crypto (disponível no Workers). */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Comparação de strings em tempo (aproximadamente) constante. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verifica a senha conforme o algoritmo registrado no usuário. */
export async function verifyPassword(
  password: string,
  passwordHash: string,
  algorithm: string,
): Promise<boolean> {
  if (algorithm === 'sha256') {
    const hashed = await sha256Hex(password);
    return timingSafeEqual(hashed, passwordHash.toLowerCase());
  }
  // Algoritmos futuros (argon2/bcrypt/pbkdf2) entram aqui.
  return false;
}

/** Token de sessão aleatório (256 bits) em hex. */
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Lê um cookie específico do header Cookie. */
export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/** Monta o cookie de sessão. Secure só em https (permite testar em localhost). */
export function buildSessionCookie(request: Request, token: string): string {
  const secure = new URL(request.url).protocol === 'https:' ? ' Secure;' : '';
  return (
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly;${secure} ` +
    `SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`
  );
}

/** Cookie que expira a sessão (logout). */
export function buildClearCookie(request: Request): string {
  const secure = new URL(request.url).protocol === 'https:' ? ' Secure;' : '';
  return `${SESSION_COOKIE}=; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=0`;
}

export function sessionExpiryIso(): string {
  return new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
}

export { SESSION_COOKIE };

/**
 * Resolve o usuário a partir do cookie de sessão.
 * Retorna null se não houver sessão válida, expirada ou usuário inativo.
 */
export async function getSessionUser(request: Request, env: Env): Promise<SessionUser | null> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT u.id AS id, u.username AS username, u.role AS role,
            u.is_active AS is_active, s.expires_at AS expires_at
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
      WHERE s.session_token_hash = ?`,
  )
    .bind(tokenHash)
    .first<{
      id: number;
      username: string;
      role: string;
      is_active: number;
      expires_at: string;
    }>();

  if (!row) return null;
  if (row.is_active !== 1) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  return { id: row.id, username: row.username, role: row.role };
}
