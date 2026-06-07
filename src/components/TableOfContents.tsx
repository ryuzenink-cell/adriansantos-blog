import { useEffect, useState } from 'react';
import type { TocHeading } from '../utils/toc';

interface TableOfContentsProps {
  headings: TocHeading[];
  /** Rótulo do topo (localizável). */
  title?: string;
}

/**
 * Sumário lateral automático ("Nesta página"). Lista h2/h3 do post e
 * destaca a seção atual conforme a rolagem usando IntersectionObserver.
 */
export function TableOfContents({ headings, title = 'On this page' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="toc" aria-label={title}>
      <p className="toc__title">{title}</p>
      <ul className="toc__list">
        {headings.map((h) => (
          <li
            key={h.id}
            className={
              `toc__item toc__item--h${h.level}` +
              (activeId === h.id ? ' toc__item--active' : '')
            }
          >
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
