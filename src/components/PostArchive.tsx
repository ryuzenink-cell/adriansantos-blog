import { Link } from 'react-router-dom';
import type { Post, Language } from '../types';
import { groupPostsByMonth } from '../utils/groupPostsByMonth';

interface PostArchiveProps {
  posts: Post[];
  language: Language;
  showLanguage?: boolean;
}

/**
 * Arquivo textual de posts agrupados por ano/mês. Sem cards, thumbnails ou
 * resumos — apenas títulos linkáveis, no espírito de um blog clássico.
 * Cada grupo recebe um id (âncora) consumido pelo sumário lateral.
 */
export function PostArchive({ posts, language, showLanguage = false }: PostArchiveProps) {
  const groups = groupPostsByMonth(posts, language);

  if (groups.length === 0) {
    return (
      <p className="archive__empty">
        {language === 'pt' ? 'Nenhum post publicado ainda.' : 'No published posts yet.'}
      </p>
    );
  }

  return (
    <div className="archive">
      {groups.map((group) => (
        <section key={group.key} id={group.key} className="archive__group">
          <h2 className="archive__month">{group.label}</h2>
          <ul className="archive__list">
            {group.posts.map((post) => (
              <li key={post.id} className="archive__item">
                <Link to={`/posts/${post.slug}`} className="archive__link">
                  {post.title}
                </Link>
                {showLanguage && <span className="post__lang">{post.language.toUpperCase()}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
