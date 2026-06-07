import type { Env } from '../../_lib/db';
import { json } from '../../_lib/http';
import { getCookie, sha256Hex, buildClearCookie, SESSION_COOKIE } from '../../_lib/auth';

// POST /api/auth/logout
// Invalida a sessão atual no banco e limpa o cookie.
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare('DELETE FROM admin_sessions WHERE session_token_hash = ?')
      .bind(tokenHash)
      .run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': buildClearCookie(request) });
};
