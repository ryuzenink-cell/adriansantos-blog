/// <reference types="vite/client" />

// gtag.js (Google Analytics 4) — carregado via <script> em index.html.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export {};
