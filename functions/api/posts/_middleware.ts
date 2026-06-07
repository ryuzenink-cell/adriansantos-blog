import type { Env } from '../../_lib/db';
import { error } from '../../_lib/http';
import { getSessionUser, type SessionUser } from '../../_lib/auth';

// Middleware: protege TODAS as rotas /api/posts/* no servidor.
// A proteção real do admin vive aqui (não só no React Router).
export const onRequest: PagesFunction<Env, string, { user: SessionUser }> = async (context) => {
  const user = await getSessionUser(context.request, context.env);
  if (!user) return error('Unauthorized', 401);
  // Disponibiliza o usuário autenticado para os handlers seguintes.
  context.data.user = user;
  return context.next();
};
