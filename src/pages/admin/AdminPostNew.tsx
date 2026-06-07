import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { PostForm } from '../../components/PostForm';
import { api } from '../../services/api';
import type { PostDraft } from '../../types';

/** Criação de post pelo editor visual. */
export function AdminPostNew() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (draft: PostDraft) => {
    setBusy(true);
    setError(null);
    try {
      await api.createPost(draft);
      navigate('/admin/posts');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create post.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page__head">
          <h1>New post</h1>
        </div>
        <PostForm
          mode="new"
          busy={busy}
          error={error}
          onSubmit={handleSubmit}
          onBack={() => navigate('/admin/posts')}
        />
      </div>
    </AdminLayout>
  );
}
