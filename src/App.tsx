import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Páginas públicas
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Search } from './pages/Search';
import { PostPage } from './pages/PostPage';

// Painel administrativo
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPosts } from './pages/admin/AdminPosts';
import { AdminPostNew } from './pages/admin/AdminPostNew';
import { AdminPostEdit } from './pages/admin/AdminPostEdit';

/** Rola para o topo a cada troca de rota (exceto quando há âncora #). */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Público */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<Search />} />
        <Route path="/posts/:slug" element={<PostPage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/posts"
          element={
            <ProtectedRoute>
              <AdminPosts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/posts/new"
          element={
            <ProtectedRoute>
              <AdminPostNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/posts/edit/:id"
          element={
            <ProtectedRoute>
              <AdminPostEdit />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
