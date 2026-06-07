import { useState } from 'react';
import type { Post, PostDraft, Language, PostStatus } from '../types';
import { PostEditor } from './PostEditor';
import { slugify } from '../utils/slugify';
import { toDateInputValue } from '../utils/date';

interface PostFormProps {
  initial?: Post;
  submitLabel: string;
  onSubmit: (draft: PostDraft) => void | Promise<void>;
  onCancel?: () => void;
}

/** Converte "a, b, c" -> ["a","b","c"] sem vazios/duplicatas. */
function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  );
}

/**
 * Formulário de criação/edição de post. Compartilhado entre as telas
 * "new" e "edit". Mantém o slug sincronizado com o título até o usuário
 * editar o slug manualmente.
 */
export function PostForm({ initial, submitLabel, onSubmit, onCancel }: PostFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [language, setLanguage] = useState<Language>(initial?.language ?? 'en');
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? 'draft');
  const [publishedAt, setPublishedAt] = useState(toDateInputValue(initial?.published_at ?? ''));
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [contentHtml, setContentHtml] = useState(initial?.content_html ?? '');
  const [error, setError] = useState('');

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Title is required.');
    if (!slug.trim()) return setError('Slug is required.');
    if (!contentHtml.trim()) return setError('Content is required.');

    // Se publicado e sem data, usa agora.
    let published_at = '';
    if (publishedAt) {
      published_at = new Date(`${publishedAt}T00:00:00`).toISOString();
    } else if (status === 'published') {
      published_at = new Date().toISOString();
    }

    const draft: PostDraft = {
      title: title.trim(),
      slug: slugify(slug),
      excerpt: excerpt.trim(),
      content_html: contentHtml,
      language,
      status,
      published_at,
      tags: parseTags(tags),
    };

    void onSubmit(draft);
  };

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="slug">Slug</label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          required
        />
        <small className="field__hint">URL: /posts/{slug || '…'}</small>
      </div>

      <div className="field">
        <label htmlFor="excerpt">Excerpt</label>
        <textarea
          id="excerpt"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short summary (optional)"
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="language">Language</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            <option value="en">English (en)</option>
            <option value="pt">Português (pt)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="published_at">Published at</label>
          <input
            id="published_at"
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="comma, separated, tags"
        />
      </div>

      <div className="field">
        <label>Content</label>
        <PostEditor value={contentHtml} onChange={setContentHtml} />
      </div>

      <div className="post-form__actions">
        <button type="submit" className="btn btn--primary">{submitLabel}</button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
