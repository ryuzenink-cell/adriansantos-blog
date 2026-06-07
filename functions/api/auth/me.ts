import type { Env } from '../../_lib/db';
import { json, error } from '../../_lib/http';
import { getSessionUser } from '../../_lib/auth';

// GET /api/auth/me
// Retorna o usuário da sessão atual ou 401 se não houver sessão válida.
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const user = await getSessionUser(request, env);
  if (!user) return error('Unauthorized', 401);
  return json(user);
};
