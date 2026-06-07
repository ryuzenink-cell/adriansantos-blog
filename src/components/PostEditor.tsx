import { useRef } from 'react';
import { sanitizeHtml } from '../utils/sanitize';

interface PostEditorProps {
  value: string;
  onChange: (html: string) => void;
}

/**
 * Editor de conteúdo semi-visual (sem Markdown).
 *
 * É um <textarea> de HTML com uma barra de botões que inserem trechos de HTML
 * na posição do cursor, mais um painel de preview ao vivo que renderiza
 * exatamente como o post aparecerá. O conteúdo é guardado como string HTML
 * (futuro campo content_html do D1).
 */
export function PostEditor({ value, onChange }: PostEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Insere/embrulha texto na seleção atual do textarea.
   * - `before`/`after`: tags em volta da seleção.
   * - `placeholder`: usado quando não há nada selecionado.
   */
  const surround = (before: string, after: string, placeholder = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);

    // Recoloca o cursor logo após o texto inserido.
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + before.length + selected.length + after.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const insertParagraph = () => surround('<p>', '</p>\n', 'Text…');
  const insertH2 = () => surround('<h2>', '</h2>\n', 'Subtitle');
  const insertH3 = () => surround('<h3>', '</h3>\n', 'Smaller subtitle');
  const insertBold = () => surround('<strong>', '</strong>', 'bold');
  const insertItalic = () => surround('<em>', '</em>', 'italic');
  const insertQuote = () => surround('<blockquote>', '</blockquote>\n', 'Quote…');
  const insertCode = () => surround('<pre><code>', '</code></pre>\n', 'code here');

  const insertLink = () => {
    const url = window.prompt('Link URL:', 'https://');
    if (!url) return;
    surround(`<a href="${url}" target="_blank" rel="noopener">`, '</a>', 'link text');
  };

  // Ao clicar em imagem, pede URL e alt, e insere <img src="URL" alt="ALT">.
  const insertImage = () => {
    const url = window.prompt('Image URL:', 'https://');
    if (!url) return;
    const alt = window.prompt('Alt text (description):', '') ?? '';
    surround(`\n<img src="${url}" alt="${alt}">\n`, '', '');
  };

  return (
    <div className="editor">
      <div className="editor__toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" className="editor__btn" onClick={insertParagraph}>¶ Paragraph</button>
        <button type="button" className="editor__btn" onClick={insertH2}>H2</button>
        <button type="button" className="editor__btn" onClick={insertH3}>H3</button>
        <span className="editor__sep" />
        <button type="button" className="editor__btn" onClick={insertBold}><strong>B</strong></button>
        <button type="button" className="editor__btn" onClick={insertItalic}><em>I</em></button>
        <span className="editor__sep" />
        <button type="button" className="editor__btn" onClick={insertLink}>🔗 Link</button>
        <button type="button" className="editor__btn" onClick={insertImage}>🖼 Image</button>
        <button type="button" className="editor__btn" onClick={insertCode}>{'</>'} Code</button>
        <button type="button" className="editor__btn" onClick={insertQuote}>❝ Quote</button>
      </div>

      <div className="editor__panes">
        <div className="editor__pane">
          <label className="editor__label" htmlFor="content_html">HTML</label>
          <textarea
            id="content_html"
            ref={textareaRef}
            className="editor__textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            placeholder="<p>Write your post in HTML…</p>"
          />
        </div>
        <div className="editor__pane">
          <span className="editor__label">Preview</span>
          <div
            className="editor__preview prose"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
          />
        </div>
      </div>
    </div>
  );
}
