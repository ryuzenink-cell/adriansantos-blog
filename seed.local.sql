-- ============================================================================
-- Seed APENAS para o D1 LOCAL (desenvolvimento com `wrangler pages dev`).
-- Aplicar: npm run db:seed:local
--
-- O banco de PRODUÇÃO já tem o usuário admin cadastrado manualmente — NÃO rode
-- este seed no remoto.
--
-- A senha abaixo é "changeme123" armazenada como SHA-256 (hex), pois a coluna
-- password_algorithm é 'sha256'. Gere o hash de OUTRA senha assim:
--
--   node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('SUA_SENHA')).then(b=>console.log(Buffer.from(b).toString('hex')))"
--
-- ⚠️ SHA-256 sem salt é fraco. Em produção, migre para Argon2/bcrypt/PBKDF2
--    com salt (ver comentários em functions/_lib/auth.ts).
-- ============================================================================

INSERT OR IGNORE INTO admin_users (username, email, password_hash, password_algorithm, role, is_active)
VALUES (
  'admin',
  'admin@adriansantos.blog',
  -- SHA-256 de "changeme123"
  '494a715f7e9b4071aca61bac42ca858a309524e5864f0920030862a4ae7589be',
  'sha256',
  'admin',
  1
);

-- Post de exemplo para a home local.
INSERT OR IGNORE INTO posts (title, slug, excerpt, content_html, language, status, published_at)
VALUES (
  'Hello from D1',
  'hello-from-d1',
  'First post served from a real Cloudflare D1 database.',
  '<h2>It works</h2><p>This post is stored in <strong>Cloudflare D1</strong> and served through a Pages Function.</p>',
  'en',
  'published',
  '2026-06-06T10:00:00.000Z'
);
