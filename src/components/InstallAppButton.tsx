import { usePwaInstall } from '../hooks/usePwaInstall';

interface InstallAppButtonProps {
  className?: string;
  /** Texto do botão (padrão "Install App"). */
  label?: string;
  /** Chamado após o clique (ex.: fechar o menu mobile). */
  onInstalled?: () => void;
}

/**
 * Botão "Install App". Só é renderizado quando há prompt nativo disponível
 * (Chromium) e o app ainda não está instalado. Em navegadores sem suporte,
 * retorna null — não polui a navbar.
 */
export function InstallAppButton({ className, label = 'Install App', onInstalled }: InstallAppButtonProps) {
  const { canInstall, installApp } = usePwaInstall();

  if (!canInstall) return null;

  const handleClick = async () => {
    await installApp();
    onInstalled?.();
  };

  return (
    <button
      type="button"
      className={className ?? 'btn btn--ghost install-btn'}
      onClick={() => void handleClick()}
      aria-label="Install this blog as an app"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      {label}
    </button>
  );
}
