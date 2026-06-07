# AdrianSantos.blog

Blog pessoal minimalista de Adrian Santos. Parte pública (foco em leitura) +
painel administrativo protegido. MVP local com **Vite + React + TypeScript**,
arquitetado para futura integração com **Cloudflare Pages Functions** e
**Cloudflare D1**.

> **Etapa atual:** tudo roda localmente. Os posts são persistidos em
> `localStorage` (semeados a partir de `src/data/mockPosts.ts`). Ainda **não**
> há banco real conectado — mas a camada de dados e os tipos já espelham o
> schema do D1, então a migração será suave.

---

## Stack

- Vite + React 18 + TypeScript
- React Router 6
- CSS puro com variáveis de tema (claro/escuro)
- Sem Tailwind, sem backend nesta etapa
- Persistência local via `localStorage`

## Funcionalidades

**Público**
- Home textual com posts publicados agrupados por **ano/mês**
- Seletor de idioma **PT | EN**
- Página de post `/posts/:slug` com tipografia de leitura e **sumário lateral
  automático** (gerado a partir dos `h2`/`h3`)
- Página **About**
- **Busca** local por título, excerpt e conteúdo
- **Tema claro/escuro** (preferência salva no `localStorage`)

**Admin** (`/admin`)
- Login local de teste
- Dashboard com contadores (total / publicados / rascunhos)
- Lista de posts com ações: editar, publicar/despublicar, excluir (com confirmação)
- Criar/editar post com **editor de HTML + preview ao vivo** (botões para
  parágrafo, h2, h3, negrito, itálico, link, imagem por URL, código e citação)

---

## Como rodar

Pré-requisito: **Node.js 18+**.

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento (abre em http://localhost:5173)
npm run dev

# 3. Build de produção (gera ./dist)
npm run build

# 4. Pré-visualizar o build localmente
npm run preview
```

### Acessar o painel admin

1. Abra `http://localhost:5173/admin/login`
2. Entre com **usuário `admin`** e **senha `123`**

> ⚠️ **Esse login é APENAS para desenvolvimento local.** As credenciais são
> fixas no front-end e a sessão é só uma flag em `localStorage` — isso **não é
> seguro** e **não deve ir para produção**. Veja `src/hooks/useAuth.ts` para o
> plano de substituição por autenticação real.

### Resetar os dados locais

Os posts ficam em `localStorage` sob a chave `adriansantos_blog_posts_v1`.
Para voltar aos posts de exemplo, limpe o storage do site no DevTools, ou rode
no console: `localStorage.clear()` e recarregue.

---

## Estrutura

```
adriansantos.blog/
├─ index.html
├─ schema.sql                  # schema do Cloudflare D1 (futuro)
├─ public/
│  ├─ favicon.svg
│  └─ _redirects               # SPA fallback p/ Cloudflare Pages
├─ functions/
│  └─ api/posts.ts             # STUB de Cloudflare Function (D1) — futuro
└─ src/
   ├─ main.tsx
   ├─ App.tsx                  # rotas (público + admin)
   ├─ types.ts                 # tipos espelhando o schema do D1
   ├─ components/
   │  ├─ Header.tsx
   │  ├─ Layout.tsx
   │  ├─ ThemeToggle.tsx
   │  ├─ PostArchive.tsx
   │  ├─ PostContent.tsx
   │  ├─ TableOfContents.tsx
   │  ├─ ProtectedRoute.tsx
   │  ├─ AdminLayout.tsx
   │  ├─ PostForm.tsx
   │  └─ PostEditor.tsx
   ├─ data/mockPosts.ts        # seed inicial
   ├─ lib/postsRepository.ts   # camada de dados (localStorage -> D1 no futuro)
   ├─ hooks/
   │  ├─ usePosts.ts
   │  ├─ useAuth.ts
   │  └─ useTheme.ts
   ├─ pages/
   │  ├─ Home.tsx
   │  ├─ About.tsx
   │  ├─ Search.tsx
   │  ├─ PostPage.tsx
   │  └─ admin/
   │     ├─ AdminLogin.tsx
   │     ├─ AdminDashboard.tsx
   │     ├─ AdminPosts.tsx
   │     ├─ AdminPostNew.tsx
   │     └─ AdminPostEdit.tsx
   ├─ utils/
   │  ├─ date.ts
   │  ├─ slugify.ts
   │  ├─ sanitize.ts
   │  ├─ toc.ts
   │  └─ groupPostsByMonth.ts
   └─ styles/global.css
```

---

## Futuro deploy no Cloudflare Pages + D1

A arquitetura já está preparada. Passos previstos:

### 1. Deploy do front (Cloudflare Pages)
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- O arquivo `public/_redirects` garante o roteamento SPA (rotas como
  `/posts/...` e `/admin/...` recarregam corretamente).

### 2. Banco D1
```bash
# criar o banco (ou usar o que você já criou)
npx wrangler d1 create adriansantos-blog

# aplicar o schema
npx wrangler d1 execute adriansantos-blog --file=./schema.sql
```
Adicione o binding do D1 como `DB` no projeto do Pages (Settings → Functions →
D1 bindings) e/ou em `wrangler.toml`.

### 3. Trocar a camada de dados
- Em `src/lib/postsRepository.ts`, substitua as leituras/escritas em
  `localStorage` por chamadas `fetch('/api/posts...')`.
- Implemente as Functions em `functions/api/` (já há um stub em
  `functions/api/posts.ts`). Os hooks e componentes **não precisam mudar**.

### 4. Autenticação real (substituir o login de dev)
Conforme comentado em `src/hooks/useAuth.ts`:
1. `POST /api/admin/login` valida o usuário na tabela `admin_users` do D1.
2. Comparar a senha com `password_hash` usando **bcrypt/scrypt/argon2** (nunca texto puro).
3. Emitir sessão assinada em **cookie HttpOnly + Secure + SameSite**.
4. Proteger `/api/admin/*` validando o cookie no servidor.
5. O front passa a checar a sessão via `GET /api/admin/me`.

---

## Notas de segurança (importante)

- O login atual (`admin` / `123`) e o `ProtectedRoute` são **client-side** e
  servem **só para desenvolvimento**. Não oferecem segurança real.
- O conteúdo HTML dos posts passa por um sanitizador básico
  (`src/utils/sanitize.ts`). Para produção, use uma lib dedicada
  (ex.: **DOMPurify**) e/ou sanitize no servidor antes de gravar no D1.
