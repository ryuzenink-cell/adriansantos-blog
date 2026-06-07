import { useCallback, useEffect, useState } from 'react';

// Evento beforeinstallprompt não é padrão tipado no TS DOM lib.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** Detecta se o app já está rodando instalado (standalone). */
function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  // iOS Safari expõe navigator.standalone.
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return mq || iosStandalone;
}

/**
 * Lógica de instalação PWA.
 *
 * Expõe:
 *  - canInstall: há um prompt nativo disponível (Chromium).
 *  - isInstalled: o app já está instalado / em modo standalone.
 *  - installApp(): dispara o prompt nativo e trata a escolha do usuário.
 *
 * Em navegadores sem suporte ao prompt (Safari/iOS, Firefox), canInstall fica
 * false e o botão simplesmente não aparece — nada quebra.
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(detectStandalone);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      // Impede o mini-infobar padrão e guarda o evento para uso posterior.
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // Reage a mudanças de display-mode (ex.: instalou e abriu standalone).
    const mq = window.matchMedia?.('(display-mode: standalone)');
    const onChange = () => setIsInstalled(detectStandalone());
    mq?.addEventListener?.('change', onChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      mq?.removeEventListener?.('change', onChange);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    // O evento só pode ser usado uma vez.
    setDeferredPrompt(null);
    if (choice.outcome === 'accepted') setIsInstalled(true);
  }, [deferredPrompt]);

  return {
    canInstall: !isInstalled && deferredPrompt !== null,
    isInstalled,
    installApp,
  };
}
