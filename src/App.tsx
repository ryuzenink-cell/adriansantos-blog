import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

// Páginas públicas (no bundle principal — leves).
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Search } from './pages/Search';
import { PostPage } from './pages/PostPage';

// Painel administrativo carregado sob demanda (code-splitting). Assim o editor
// visual (TipTap) NÃO pesa no bundle público.
import { ProtectedRoute } from './components/ProtectedRoute';
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts').then((m) => ({ default: m.AdminPosts })));
const AdminPostNew = lazy(() => import('./pages/admin/AdminPostNew').then((m) => ({ default: m.AdminPostNew })));
const AdminPostEdit = lazy(() => import('./pages/admin/AdminPostEdit').then((m) => ({ default: m.AdminPostEdit })));

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
      <AuthProvider>
        <ScrollToTop />
        <Suspense fallback={<div className="route-loading">Loading…</div>}>
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
