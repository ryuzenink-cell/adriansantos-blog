import { useState } from 'react';
import type { Post, PostDraft, Language, PostStatus } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { slugify } from '../utils/slugify';
import { toDateInputValue, formatLongDate } from '../utils/date';
import { sanitizeHtml } from '../utils/sanitize';

interface PostFormProps {
  mode: 'new' | 'edit';
  initial?: Post;
  busy?: boolean;
  error?: string | null;
  onSubmit: (draft: PostDraft) => void | Promise<void>;
  onBack: () => void;
}

function parseTags(input: string): string[] {
  return Array.from(
    new Set(input.split(',').map((t) => t.trim()).filter(Boolean)),
  );
}

/**
 * Painel de criação/edição estilo CMS. Usa o editor visual (TipTap) — o usuário
 * não digita HTML. Ao salvar, o HTML do editor é enviado à API, que sanitiza
 * antes de gravar no D1.
 */
export function PostForm({ mode, initial, busy, error, onSubmit, onBack }: PostFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [language, setLanguage] = useState<Language>(initial?.language ?? 'en');
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? 'draft');
  const [publishedAt, setPublishedAt] = useState(toDateInputValue(initial?.published_at ?? ''));
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [contentHtml, setContentHtml] = useState(initial?.content_html ?? '');
  const [localError, setLocalError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const buildDraft = (statusOverride?: PostStatus): PostDraft | null => {
    if (!title.trim()) {
      setLocalError('Title is required.');
      return null;
    }
    // TipTap em branco gera "<p></p>".
    const isEmpty = !contentHtml.replace(/<p>\s*<\/p>/g, '').replace(/<[^>]+>/g, '').trim();
    if (isEmpty) {
      setLocalError('Content is required.');
      return null;
    }
    setLocalError('');

    const finalStatus = statusOverride ?? status;
    let published_at = '';
    if (publishedAt) {
      published_at = new Date(`${publishedAt}T00:00:00`).toISOString();
    } else if (finalStatus === 'published') {
      published_at = new Date().toISOString();
    }

    return {
      title: title.trim(),
      slug: slugify(slug) || slugify(title),
      excerpt: excerpt.trim(),
      content_html: contentHtml,
      language,
      status: finalStatus,
      published_at,
      tags: parseTags(tags),
    };
  };

  const submit = (statusOverride?: PostStatus) => {
    const draft = buildDraft(statusOverride);
    if (!draft) return;
    if (statusOverride) setStatus(statusOverride);
    void onSubmit(draft);
  };

  return (
    <div className="post-form">
      {(localError || error) && <p className="form-error">{localError || error}</p>}

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Post title"
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
          <select id="language" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            <option value="en">English (EN)</option>
            <option value="pt">Português (PT)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as PostStatus)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="published_at">Published at</label>
          <input id="published_at" type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="tags">Tags</label>
        <input id="tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated, tags" />
      </div>

      <div className="field">
        <label>Content</label>
        <RichTextEditor value={contentHtml} onChange={setContentHtml} />
      </div>

      <div className="post-form__actions">
        {mode === 'new' ? (
          <>
            <button type="button" className="btn" disabled={busy} onClick={() => submit('draft')}>
              Save draft
            </button>
            <button type="button" className="btn btn--primary" disabled={busy} onClick={() => submit('published')}>
              Publish
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => submit()}>
            Update
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={() => setShowPreview(true)}>
          Preview
        </button>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          Back to posts
        </button>
      </div>

      {showPreview && (
        <div className="preview-overlay" role="dialog" aria-modal="true" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal__bar">
              <span>Preview</span>
              <button type="button" className="btn btn--ghost" onClick={() => setShowPreview(false)}>Close</button>
            </div>
            <article className="preview-modal__body">
              <h1 className="post__title">{title || 'Untitled'}</h1>
              <div className="post__meta">
                <span>{formatLongDate(publishedAt ? `${publishedAt}T00:00:00` : new Date().toISOString(), language)}</span>
                <span className="post__lang">{language.toUpperCase()}</span>
              </div>
              <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentHtml) }} />
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
