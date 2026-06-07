import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

/**
 * Editor visual (WYSIWYG) baseado em TipTap. O usuário escreve como no
 * WordPress/Blogger — sem digitar tags HTML. O conteúdo é exportado como HTML
 * (editor.getHTML()) e enviado à API, que o sanitiza antes de gravar no D1.
 */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, // só H2/H3 no corpo do post
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'rte__content prose' },
    },
  });

  if (!editor) return <div className="rte rte--loading">Loading editor…</div>;

  return (
    <div className="rte">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL:', previous ?? 'https://');
    if (url === null) return; // cancelou
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const addImage = () => {
    const src = window.prompt('Image URL:', 'https://');
    if (!src) return;
    const alt = window.prompt('Alt text (description):', '') ?? '';
    editor.chain().focus().setImage({ src: src.trim(), alt }).run();
  };

  return (
    <div className="rte__toolbar" role="toolbar" aria-label="Formatting">
      <Btn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} label="Paragraph">¶</Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="Heading 2">H2</Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="Heading 3">H3</Btn>
      <span className="rte__sep" />
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Bold"><strong>B</strong></Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italic"><em>I</em></Btn>
      <span className="rte__sep" />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="Bullet list">• List</Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="Numbered list">1. List</Btn>
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="Quote">❝</Btn>
      <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} label="Code block">{'</>'}</Btn>
      <span className="rte__sep" />
      <Btn onClick={setLink} active={editor.isActive('link')} label="Link">🔗</Btn>
      <Btn onClick={addImage} active={false} label="Image">🖼</Btn>
      <span className="rte__sep" />
      <Btn onClick={() => editor.chain().focus().undo().run()} active={false} label="Undo" disabled={!editor.can().undo()}>↶</Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} active={false} label="Redo" disabled={!editor.can().redo()}>↷</Btn>
    </div>
  );
}

function Btn({
  onClick,
  active,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`rte__btn${active ? ' rte__btn--active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
