import React, { useState, useEffect } from 'react';
import { Download, Laptop, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptBannerProps {
  variant?: 'floating' | 'inline';
  className?: string;
}

export const InstallPromptBanner: React.FC<InstallPromptBannerProps> = ({
  variant = 'floating',
  className = '',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    // 1. Verificar si ya está ejecutándose como PWA instalada
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // 2. Capturar evento 'beforeinstallprompt'
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 3. Detectar cuando la app se instala con éxito
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Para instalar en tu Chromebook: Haz clic en el menú (⋮) de Chrome y selecciona "Instalar Notas..."');
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || isInstalled || isDismissed) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-ios-yellow/10 hover:bg-ios-yellow/20 text-ios-yellow border border-ios-yellow/30 transition-all active:scale-98 select-none ${className}`}
        title="Instalar como aplicación nativa en tu Chromebook"
      >
        <div className="flex items-center gap-2">
          <Laptop size={15} className="stroke-[2.2]" />
          <span>Instalar App</span>
        </div>
        <Download size={13} />
      </button>
    );
  }

  // Floating Toast Banner: Posición fija sin afectar el flujo del layout
  return (
    <aside
      aria-label="Instalación de aplicación"
      className={`fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] bg-ios-card/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-ios-border/90 dark:border-white/10 rounded-2xl p-3.5 shadow-ios-floating select-none animate-in fade-in slide-in-from-bottom-4 duration-300 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-ios-yellow text-white flex items-center justify-center shrink-0 shadow-md">
            <Laptop size={19} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-ios-text dark:text-white leading-tight">
                Instalar Notas Escolares
              </h4>
              <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase bg-ios-yellow/15 text-ios-yellow px-1.5 py-0.5 rounded-full">
                <Sparkles size={9} /> PWA
              </span>
            </div>
            <p className="text-[11px] text-ios-textSecondary dark:text-[#A1A1A6] mt-0.5 leading-snug">
              Usa la app en pantalla completa y 100% offline en tu Chromebook.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-ios-textTertiary dark:text-[#6E6E73] hover:text-ios-text dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
          title="Descartar"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-ios-borderSubtle dark:border-white/[0.06]">
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-ios-textSecondary dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          Ahora no
        </button>
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ios-yellow hover:bg-ios-yellowHover text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
        >
          <Download size={13} />
          <span>Instalar</span>
        </button>
      </div>
    </aside>
  );
};
