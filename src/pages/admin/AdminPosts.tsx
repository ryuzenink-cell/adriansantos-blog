import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { usePosts } from '../../hooks/usePosts';
import { toDateInputValue } from '../../utils/date';
import type { Post } from '../../types';

/** Lista de posts com ações: editar, publicar/despublicar, excluir. */
export function AdminPosts() {
  const { posts, loading, deletePost, togglePublish } = usePosts();

  const handleDelete = (post: Post) => {
    // Confirmação antes de excluir.
    const ok = window.confirm(`Delete "${post.title}"? This cannot be undone.`);
    if (ok) void deletePost(post.id);
  };

  // Mais recentes primeiro (por criação).
  const ordered = [...posts].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page__head">
          <h1>Posts</h1>
          <Link to="/admin/posts/new" className="btn btn--primary">
            + New post
          </Link>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : ordered.length === 0 ? (
          <p className="muted">No posts yet. Create your first one.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Lang</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th className="table__actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((post) => (
                  <tr key={post.id}>
                    <td>{post.title}</td>
                    <td><code>{post.slug}</code></td>
                    <td>{post.language.toUpperCase()}</td>
                    <td>
                      <span className={`badge badge--${post.status}`}>{post.status}</span>
                    </td>
                    <td>{post.published_at ? toDateInputValue(post.published_at) : '—'}</td>
                    <td className="table__actions">
                      <Link to={`/admin/posts/edit/${post.id}`} className="link-btn">
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => void togglePublish(post)}
                      >
                        {post.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        className="link-btn link-btn--danger"
                        onClick={() => handleDelete(post)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
