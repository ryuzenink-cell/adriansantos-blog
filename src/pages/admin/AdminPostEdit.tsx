import { useNavigate, useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { PostForm } from '../../components/PostForm';
import { usePosts } from '../../hooks/usePosts';
import type { PostDraft } from '../../types';

/** Edição de post existente: /admin/posts/edit/:id */
export function AdminPostEdit() {
  const { id } = useParams<{ id: string }>();
  const { posts, loading, updatePost } = usePosts();
  const navigate = useNavigate();

  const postId = Number(id);
  const post = posts.find((p) => p.id === postId);

  const handleSubmit = async (draft: PostDraft) => {
    await updatePost(postId, draft);
    navigate('/admin/posts');
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
            Post not found. <Link to="/admin/posts">Back to posts</Link>.
          </p>
        ) : (
          <PostForm
            initial={post}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            onCancel={() => navigate('/admin/posts')}
          />
        )}
      </div>
    </AdminLayout>
  );
}
