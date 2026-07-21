import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

const root = document.getElementById('root')!;

// Páginas de post (e erro) são renderizadas no servidor com o artigo completo
// já no HTML (ver functions/posts/[slug].ts). Nesse caso o servidor marca
// #root com data-render-mode="server-post" — não montamos o React por cima
// para não apagar esse conteúdo. Não usamos hydrateRoot porque o HTML gerado
// no servidor não é a mesma árvore que o React produziria (evita mismatch);
// essas páginas funcionam como HTML tradicional, sem virar SPA depois.
if (root.dataset.renderMode !== 'server-post') {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
