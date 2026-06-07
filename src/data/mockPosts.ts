import type { Post } from '../types';

// Posts iniciais (seed). São gravados no localStorage na primeira execução
// (ver src/hooks/usePosts.ts). A estrutura imita 1:1 a tabela `posts` do D1.
//
// No futuro estes dados sairão daqui e virão de uma Cloudflare Function
// consultando o D1 — o formato é o mesmo, então nada no front muda.

export const mockPosts: Post[] = [
  {
    id: 1,
    title: 'Building my personal blog',
    slug: 'building-my-personal-blog',
    excerpt: 'Notes on bootstrapping a minimalist blog with Vite, React and a future Cloudflare D1 backend.',
    language: 'en',
    status: 'published',
    published_at: '2026-06-05T10:00:00.000Z',
    created_at: '2026-06-05T10:00:00.000Z',
    updated_at: '2026-06-05T10:00:00.000Z',
    tags: ['meta', 'react', 'cloudflare'],
    content_html: `
<p>This is the very first post of my new personal blog. The goal here is simple: a quiet, text-first place to write about software engineering and the small projects I build on the side.</p>

<h2>Why build it from scratch</h2>
<p>I wanted something I fully control, with no heavy CMS and no portal-like layout. Just typography, content and a fast page.</p>

<h3>The stack</h3>
<p>For this first iteration the stack is intentionally small:</p>
<ul>
  <li>Vite + React + TypeScript</li>
  <li>Plain CSS with light/dark themes</li>
  <li>localStorage for now, <strong>Cloudflare D1</strong> later</li>
</ul>

<h2>Writing experience</h2>
<p>Posts are written through a tiny admin panel — no Markdown files. The content is stored as HTML, which keeps the rendering layer trivial.</p>
<blockquote>Keep it boring. Boring is reliable.</blockquote>

<h3>What comes next</h3>
<p>The next step is wiring the admin to real Cloudflare Pages Functions talking to D1. The data shape is already aligned, so it should be a smooth migration.</p>
<pre><code>SELECT title, slug FROM posts WHERE status = 'published';</code></pre>
`.trim(),
  },
  {
    id: 2,
    title: 'First notes about software engineering',
    slug: 'first-notes-about-software-engineering',
    excerpt: 'A few principles I keep coming back to after years of writing software.',
    language: 'en',
    status: 'published',
    published_at: '2026-06-02T09:00:00.000Z',
    created_at: '2026-06-02T09:00:00.000Z',
    updated_at: '2026-06-02T09:00:00.000Z',
    tags: ['engineering', 'career'],
    content_html: `
<p>Some ideas only become obvious after you've shipped enough code. Here are a few that stuck with me.</p>

<h2>Simplicity scales</h2>
<p>The simplest thing that works is usually also the easiest to change later. Complexity is a loan with very high interest.</p>

<h2>Write for the reader</h2>
<p>Code is read far more often than it is written. The same is true for documentation and, well, blog posts.</p>

<h3>Small, reversible steps</h3>
<p>Prefer changes you can undo. They lower the cost of being wrong, which means you can move faster.</p>
`.trim(),
  },
  {
    id: 3,
    title: 'Construindo meu blog pessoal',
    slug: 'construindo-meu-blog-pessoal',
    excerpt: 'Anotações sobre montar um blog minimalista com Vite, React e, no futuro, Cloudflare D1.',
    language: 'pt',
    status: 'published',
    published_at: '2026-06-04T12:00:00.000Z',
    created_at: '2026-06-04T12:00:00.000Z',
    updated_at: '2026-06-04T12:00:00.000Z',
    tags: ['meta', 'react'],
    content_html: `
<p>Este é o primeiro post da versão em português do blog. A ideia é ter um espaço calmo e focado em leitura para escrever sobre engenharia de software.</p>

<h2>Por que do zero</h2>
<p>Eu queria algo totalmente sob meu controle, sem um CMS pesado e sem cara de portal. Só tipografia, conteúdo e uma página rápida.</p>

<h3>A stack</h3>
<ul>
  <li>Vite + React + TypeScript</li>
  <li>CSS puro com tema claro/escuro</li>
  <li>localStorage agora, <strong>Cloudflare D1</strong> depois</li>
</ul>

<h2>Escrita</h2>
<p>Os posts são escritos por um pequeno painel administrativo — sem arquivos Markdown. O conteúdo é guardado como HTML.</p>
<blockquote>Mantenha simples. Simples é confiável.</blockquote>
`.trim(),
  },
  {
    id: 4,
    title: "My first Ren'Py experiment",
    slug: 'my-first-renpy-experiment',
    excerpt: 'Playing with the Ren\'Py visual novel engine for a tiny weekend project.',
    language: 'en',
    status: 'published',
    published_at: '2026-05-18T16:00:00.000Z',
    created_at: '2026-05-18T16:00:00.000Z',
    updated_at: '2026-05-18T16:00:00.000Z',
    tags: ['gamedev', 'python', 'renpy'],
    content_html: `
<p>Over the weekend I tried <a href="https://www.renpy.org/" target="_blank" rel="noopener">Ren'Py</a>, a Python-based engine for visual novels. Here are my first impressions.</p>

<h2>Getting started</h2>
<p>The onboarding is surprisingly gentle. You describe scenes in a small scripting language and the engine handles the rest.</p>

<h3>A minimal script</h3>
<pre><code>label start:
    "Hello, world."
    menu:
        "Continue":
            jump chapter_one
</code></pre>

<h2>Verdict</h2>
<p>For interactive storytelling it removes a ton of friction. I'll definitely build something bigger with it.</p>
`.trim(),
  },
  {
    id: 5,
    title: 'A draft I am still writing',
    slug: 'a-draft-i-am-still-writing',
    excerpt: 'This one is not published yet — it only shows up in the admin panel.',
    language: 'en',
    status: 'draft',
    published_at: '',
    created_at: '2026-06-06T08:00:00.000Z',
    updated_at: '2026-06-06T08:00:00.000Z',
    tags: ['wip'],
    content_html: `<p>Work in progress. This draft demonstrates that unpublished posts never appear on the public home.</p>`,
  },
];
