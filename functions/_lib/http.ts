// Helpers HTTP para as Pages Functions.

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export function error(message: string, status = 400, headers: Record<string, string> = {}): Response {
  return json({ error: message }, status, headers);
}

/** Lê o corpo JSON com segurança; devolve null se inválido. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
