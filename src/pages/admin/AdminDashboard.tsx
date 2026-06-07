import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { usePosts } from '../../hooks/usePosts';

/** Dashboard: contadores resumidos + atalho para criar post. */
export function AdminDashboard() {
  const { posts, loading } = usePosts();

  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.status === 'published').length;
    const drafts = total - published;
    return { total, published, drafts };
  }, [posts]);

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page__head">
          <h1>Dashboard</h1>
          <Link to="/admin/posts/new" className="btn btn--primary">
            + New post
          </Link>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="stats">
            <div className="stat">
              <span className="stat__value">{stats.total}</span>
              <span className="stat__label">Total posts</span>
            </div>
            <div className="stat">
              <span className="stat__value">{stats.published}</span>
              <span className="stat__label">Published</span>
            </div>
            <div className="stat">
              <span className="stat__value">{stats.drafts}</span>
              <span className="stat__label">Drafts</span>
            </div>
          </div>
        )}

        <p className="muted" style={{ marginTop: '2rem' }}>
          Manage everything in <Link to="/admin/posts">Posts</Link>.
        </p>
      </div>
    </AdminLayout>
  );
}
