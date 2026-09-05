import React, { useState, useEffect } from 'react';
import { Download, Laptop, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptBannerProps {
  variant?: 'banner' | 'button';
  className?: string;
}

export const InstallPromptBanner: React.FC<InstallPromptBannerProps> = ({
  variant = 'button',
  className = '',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

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
      alert(
        'Para instalar en tu Chromebook:\n1. Haz clic en los tres puntos (⋮) de Chrome arriba a la derecha.\n2. Selecciona "Instalar Notas..." o "Guardar y compartir > Crear acceso directo".'
      );
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || isInstalled || isDismissed) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div
        className={`bg-gradient-to-r from-ios-yellowLight to-amber-50 border border-ios-yellow/30 rounded-xl p-3 flex items-center justify-between gap-3 shadow-ios-sm select-none ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-ios-yellow text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Laptop size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-ios-text leading-tight truncate">
              Instalar en Chromebook
            </h4>
            <p className="text-[11px] text-ios-textSecondary truncate">
              Acceso instantáneo 100% offline sin conexión
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ios-yellow hover:bg-ios-yellowHover text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            <Download size={13} />
            <span>Instalar</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-ios-textTertiary hover:text-ios-text rounded-md hover:bg-black/5"
            title="Descartar"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-ios text-xs font-semibold bg-ios-yellowLight hover:bg-ios-yellow/15 text-ios-yellow border border-ios-yellow/30 transition-all active:scale-98 select-none ${className}`}
      title="Instalar como aplicación nativa en tu Chromebook"
    >
      <div className="flex items-center gap-2">
        <Laptop size={15} className="stroke-[2.2]" />
        <span>Instalar en Chromebook</span>
      </div>
      <Download size={13} />
    </button>
  );
};
