# AdrianSantos.blog

Blog pessoal de Adrian Santos. Parte pública minimalista (foco em leitura) +
painel administrativo estilo CMS, agora conectado ao **Cloudflare D1** através de
**Cloudflare Pages Functions**.

- **Front-end:** Vite + React 18 + TypeScript + React Router + CSS próprio
- **Back-end:** Cloudflare Pages Functions (`/functions`)
- **Banco:** Cloudflare D1 (`adriansantos-blog-prod`), binding `DB`
- **Editor:** TipTap (WYSIWYG) — sem digitar HTML
- **Auth:** sessão por cookie HttpOnly, senha verificada por SHA-256 contra `admin_users`

---

## Arquitetura

```
Browser ──► React (Pages, dist/) ──► /api/* ──► Pages Functions ──► D1 (DB)
```

- O front **nunca** fala direto com o D1. Tudo passa pela API em `/api/*`.
- A sessão vive num cookie **HttpOnly** (inacessível ao JS). Nada de token ou
  senha em `localStorage`.
- O `content_html` é **sanitizado no servidor** antes de gravar (defesa XSS).

### Endpoints

Públicos:
- `GET /api/public/posts` — lista posts publicados (sem corpo), p/ a home.
- `GET /api/public/post?slug=...` — um post publicado pelo slug (404 se não existir).

Auth:
- `POST /api/auth/login` — `{ username, password }`; cria sessão + cookie.
- `POST /api/auth/logout` — invalida a sessão e limpa o cookie.
- `GET  /api/auth/me` — usuário da sessão atual (401 se não houver).

Admin (exigem sessão — protegidos por `functions/api/posts/_middleware.ts`):
- `GET    /api/posts` — lista todos (draft + published).
- `GET    /api/posts/:id` — busca p/ edição.
- `POST   /api/posts` — cria.
- `PUT    /api/posts/:id` — atualiza.
- `DELETE /api/posts/:id` — exclui.

---

## 1. Instalar dependências

Pré-requisito: **Node.js 18+**.

```bash
npm install
```

## 2. Rodar o front-end isolado (sem API)

Útil para mexer só no visual. As chamadas a `/api/*` **não** funcionam aqui.

```bash
npm run dev          # http://localhost:5173
```

## 3. Rodar tudo localmente (front + Functions + D1) com Wrangler

Esta é a forma de testar a aplicação completa.

```bash
# 3.1 Criar e popular o banco D1 LOCAL (uma vez)
npm run db:schema:local   # aplica schema.sql no D1 local
npm run db:seed:local     # cria usuário admin local + 1 post de exemplo

# 3.2 Buildar e servir com as Functions + D1 local
npm run cf:dev            # build + wrangler pages dev  ->  http://localhost:8788
```

> O D1 local é um SQLite gerenciado pelo Wrangler em `.wrangler/`. Não afeta o
> banco de produção.

**Usuário do seed local:** `admin` / `changeme123` (apenas local — ver `seed.local.sql`).
Para gerar o hash SHA-256 de outra senha:

```bash
node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('SUA_SENHA')).then(b=>console.log(Buffer.from(b).toString('hex')))"
```

## 4. Configurar o binding D1

O `wrangler.toml` real é **gitignored** (contém o ID do seu banco). Copie o
exemplo e preencha:

```bash
cp wrangler.example.toml wrangler.toml         # Linux/macOS
Copy-Item wrangler.example.toml wrangler.toml  # PowerShell
```

Em `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "adriansantos-blog-prod"
database_id = "SEU_DATABASE_ID"   # veja com: npx wrangler d1 list
```

No código das Functions o banco é acessado como `env.DB`.

## 5. Configurar no Cloudflare Pages (produção)

No painel do Cloudflare Pages, ao conectar o repositório:

- **Framework preset:** None (ou Vite, se aparecer)
- **Build command:** `npm run build`
- **Build output directory:** `dist`

## 6. Vincular o D1 ao Pages

Pages → seu projeto → **Settings → Functions → D1 database bindings**:

- **Variable name:** `DB`
- **D1 database:** `adriansantos-blog-prod`

Aplicar o schema no banco **remoto** (uma vez):

```bash
npm run db:schema:remote
```

> O usuário admin de produção já está cadastrado manualmente na tabela
> `admin_users`. **Não** rode o seed local no banco remoto.

## 7. Testar o login real

1. Acesse `/admin/login`.
2. Use o usuário cadastrado em `admin_users` (em produção, o seu; em local, o do seed).
3. A senha é validada comparando o **SHA-256** dela com `password_hash`.
   A tela mostra apenas a mensagem genérica `Invalid username or password.` em erro.

## 8. Criar posts pelo painel

1. `/admin` → **New post**.
2. Escreva no **editor visual** (negrito, títulos, listas, citação, código, link,
   imagem por URL) — sem digitar HTML.
3. **Save draft** ou **Publish**. Use **Preview** para ver como ficará.
4. Posts publicados aparecem automaticamente na home.

## 9. Deploy

```bash
npm run cf:deploy        # build + wrangler pages deploy
```

(ou apenas `git push` se o projeto estiver com deploy automático no Pages.)

---

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Vite (só front, sem API) |
| `npm run build` | Type-check + build em `dist/` |
| `npm run cf:dev` | Build + `wrangler pages dev` (front + Functions + D1 local) |
| `npm run cf:deploy` | Build + deploy no Cloudflare Pages |
| `npm run db:schema:local` / `:remote` | Aplica `schema.sql` |
| `npm run db:seed:local` | Popula o D1 local (admin + post) |

---

## Estrutura

```
adriansantos.blog/
├─ wrangler.toml              # config Pages + binding D1 (DB)
├─ schema.sql                 # schema do D1
├─ seed.local.sql            # seed SÓ para o D1 local
├─ public/_redirects         # SPA fallback (mantém /api/* nas Functions)
├─ functions/
│  ├─ _lib/                   # libs server (não viram rotas)
│  │  ├─ http.ts  db.ts  auth.ts  sanitize.ts  slugify.ts  tags.ts
│  ├─ api/
│  │  ├─ public/posts.ts  public/post.ts
│  │  ├─ auth/login.ts  auth/logout.ts  auth/me.ts
│  │  └─ posts/_middleware.ts  posts/index.ts  posts/[id].ts
└─ src/
   ├─ services/api.ts         # cliente HTTP (cookie de sessão)
   ├─ hooks/ useAuth.tsx  usePosts.ts  useTheme.ts
   ├─ components/ ... RichTextEditor.tsx (TipTap)  PostForm.tsx
   ├─ pages/ Home  About  Search  PostPage  + admin/*
   ├─ utils/  styles/global.css
```

---

## PWA / instalar como app

O blog é um **PWA** (via `vite-plugin-pwa`): pode ser instalado como app e
funciona com cache de assets estáticos.

- **Manifest:** gerado no build em `dist/manifest.webmanifest` (configurado em
  `vite.config.ts`); o `<link rel="manifest">` é injetado automaticamente.
- **Service worker:** gerado em `dist/sw.js` (Workbox). Faz precache só de
  assets estáticos. **Não** cacheia `/api/*` (chamadas sempre vão à rede) e o
  fallback de navegação ignora `/api/` e `/admin` (`navigateFallbackDenylist`),
  então conteúdo do painel/admin não fica cacheado indevidamente.
- **Botão Install App:** aparece na navbar (desktop) e no menu mobile **apenas
  quando o navegador oferece o prompt nativo** (`beforeinstallprompt`) e o app
  ainda não está instalado. Caso contrário, fica oculto — nada quebra.

### Ícones

Os ícones em `public/icons/` e `public/apple-touch-icon.png` são **placeholders**
(um "A" branco sobre azul), gerados por `scripts/gen-icons.mjs`:

```bash
node scripts/gen-icons.mjs
```

Substitua-os pela arte real quando tiver (mantendo os mesmos nomes/tamanhos:
`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).

### Como testar a instalação

1. `npm run cf:dev` (ou `npm run build && npm run preview`).
2. Abra no **Chrome/Edge desktop ou Android** → deve surgir o botão **Install App**
   (ou o ícone de instalar na barra de endereço). Clique e confirme.
3. Reabra como app: ele roda em janela própria (standalone) e o botão Install
   some (detecção via `display-mode: standalone`).

### Limitações conhecidas

- **iOS/Safari:** não dispara `beforeinstallprompt`. A instalação é manual
  (Compartilhar → *Adicionar à Tela de Início*). Por isso o botão **não aparece**
  no iOS — é o comportamento esperado.
- **Firefox (desktop):** também não suporta o prompt nativo; o botão fica oculto.
- O service worker só funciona em **build** (desligado em `npm run dev`) e exige
  **HTTPS** em produção (Cloudflare Pages já fornece) ou `localhost`.

## Responsividade

- Breakpoints: desktop >1024px · tablet 768–1024px · mobile <768px · pequeno <480px.
- Navbar vira **menu hambúrguer** abaixo de 768px (acessível: `aria-expanded`,
  fecha com **Esc**, ao clicar num link e ao clicar fora).
- Sumário lateral do post sobe para cima do conteúdo no mobile.
- Tabela de posts do admin tem `overflow-x`; formulários viram 1 coluna;
  toolbar do editor quebra linha; botões de ação ocupam largura no mobile.
- `overflow-x: hidden` global evita scroll horizontal.

## SEO: sitemap & robots

- **`/sitemap.xml`** é gerado dinamicamente pela Pages Function
  `functions/sitemap.xml.ts`, consultando o D1. Inclui a home (`priority 1.0`),
  `/about` (`0.8`) e cada post **publicado** em `/posts/<slug>` (`0.7`), com
  `lastmod` derivado de `updated_at` → `published_at` → `created_at` (omitido se
  não houver data confiável). Rascunhos, `/admin` e `/api` ficam de fora.
  Content-Type: `application/xml; charset=utf-8`. Cache de edge de 1h, então
  posts novos entram no sitemap em até uma hora.
- **`/robots.txt`** (`public/robots.txt`) libera o site, bloqueia
  `/admin`, `/login`, `/dashboard`, `/api` e aponta para o sitemap.
- O service worker **não** intercepta `/sitemap.xml` nem `/robots.txt`
  (`navigateFallbackDenylist`), então abrir essas URLs no navegador retorna o
  conteúdo real, não o app.

### Testar
```bash
npm run cf:dev
# depois:
#   http://localhost:8788/sitemap.xml   -> XML com home, /about e posts publicados
#   http://localhost:8788/robots.txt    -> texto com a linha Sitemap:
```
Validação rápida: as `<loc>` devem ser absolutas (`https://adriansantos.blog/...`),
posts publicados aparecem, rascunhos não, e nenhuma URL `/admin` ou `/api`.

### Google Search Console
Em produção, envie `https://adriansantos.blog/sitemap.xml` em
**Search Console → Sitemaps**. O `robots.txt` já referencia o sitemap, então
os crawlers também o descobrem sozinhos.

## Segurança

Implementado nesta versão:
- Sessão por **cookie HttpOnly + SameSite=Lax** (Secure em https).
- Senha verificada por **SHA-256** contra `admin_users` (sem senha em texto puro).
- Token de sessão aleatório; no banco guarda-se só o **hash** do token.
- Mensagem de login **genérica** (não revela se o usuário existe).
- Rotas admin protegidas **no backend** (middleware), não só no React Router.
- `content_html` **sanitizado no servidor** (allowlist) antes de gravar.
- Queries 100% com **prepared statements** do D1.

Evolução recomendada (comentada no código):
- Migrar o hash de senha de SHA-256 para **Argon2id / bcrypt / PBKDF2 com salt**
  por usuário (ver `functions/_lib/auth.ts`).
- Considerar **DOMPurify** / sanitização adicional e rotação de sessões.
- Upload de imagens via **Cloudflare R2** (hoje a imagem é inserida por URL).
