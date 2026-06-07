import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { PostForm } from '../../components/PostForm';
import { usePosts } from '../../hooks/usePosts';
import type { PostDraft } from '../../types';

/** Criação de post. */
export function AdminPostNew() {
  const { createPost } = usePosts();
  const navigate = useNavigate();

  const handleSubmit = async (draft: PostDraft) => {
    await createPost(draft);
    navigate('/admin/posts');
  };

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page__head">
          <h1>New post</h1>
        </div>
        <PostForm
          submitLabel="Create post"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/posts')}
        />
      </div>
    </AdminLayout>
  );
}
