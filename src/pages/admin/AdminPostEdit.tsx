import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { PostForm } from '../../components/PostForm';
import { api } from '../../services/api';
import type { Post, PostDraft } from '../../types';

/** Edição de post existente: /admin/posts/edit/:id */
export function AdminPostEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const postId = Number(id);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega o post real do banco para edição.
  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getPost(postId)
      .then((p) => active && setPost(p))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load post.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [postId]);

  const handleSubmit = async (draft: PostDraft) => {
    setBusy(true);
    setError(null);
    try {
      await api.updatePost(postId, draft);
      navigate('/admin/posts');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update post.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page__head">
          <h1>Edit post</h1>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : !post ? (
          <p className="muted">
            {error ?? 'Post not found.'} <Link to="/admin/posts">Back to posts</Link>.
          </p>
        ) : (
          <PostForm
            mode="edit"
            initial={post}
            busy={busy}
            error={error}
            onSubmit={handleSubmit}
            onBack={() => navigate('/admin/posts')}
          />
        )}
      </div>
    </AdminLayout>
  );
}
