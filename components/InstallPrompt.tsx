import React, { useState, useEffect } from 'react';
import { X, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { School } from 'lucide-react';

const STORAGE_KEY = 'pervozhub_install_prompt_dismissed';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (nav.standalone === true) ||
    (document.referrer.includes('android-app://'))
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

export const InstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    try {
      if (isStandalone()) return;
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed === 'true') return;
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setVisible(false);
    setShowTutorial(false);
  };

  if (!visible) return null;

  const ios = isIOS();
  const android = isAndroid();

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[110] safe-area-pb px-4 pb-4 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-[420px] animate-slide-up">
      <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-xl border border-[#efefef] dark:border-[#262626] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0095f6] to-[#00376b] flex items-center justify-center text-white">
            <School size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#262626] dark:text-[#fafafa] text-[15px]">
              Установити додаток
            </h3>
            <p className="text-sm text-[#737373] dark:text-[#a3a3a3] mt-0.5">
              Додайте PervozHub на екран домівки для зручного доступу
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-[#737373] dark:text-[#a3a3a3] hover:bg-[#efefef] dark:hover:bg-[#262626] transition-colors"
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tutorial toggle */}
        <div className="border-t border-[#efefef] dark:border-[#262626]">
          <button
            onClick={() => setShowTutorial((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-[#0095f6] hover:bg-[#efefef]/50 dark:hover:bg-[#262626]/50 transition-colors"
          >
            <span className="font-semibold text-sm flex items-center gap-2">
              <Smartphone size={18} />
              Як це зробити?
            </span>
            {showTutorial ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showTutorial && (
            <div className="px-4 pb-4 space-y-4 animate-fade-in">
              {/* iOS */}
              <div className="bg-[#f5f5f5] dark:bg-[#262626] rounded-xl p-4">
                <h4 className="font-bold text-[#262626] dark:text-[#fafafa] text-sm mb-3 flex items-center gap-2">
                  <span className="text-lg">🍎</span> iPhone / iPad (Safari)
                </h4>
                <ol className="space-y-2 text-sm text-[#262626] dark:text-[#e5e5e5]">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-xs font-bold">1</span>
                    <span>Відкрийте сайт у <strong>Safari</strong> (не в Chrome).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-xs font-bold">2</span>
                    <span>Натисніть кнопку <strong>«Поділитися»</strong> (квадрат зі стрілкою вгору внизу екрана).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-xs font-bold">3</span>
                    <span>Прокрутіть і виберіть <strong>«На екран „Домівка”»</strong> / «Add to Home Screen».</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-xs font-bold">4</span>
                    <span>Натисніть <strong>«Додати»</strong>.</span>
                  </li>
                </ol>
              </div>

              {/* Android */}
              <div className="bg-[#f5f5f5] dark:bg-[#262626] rounded-xl p-4">
                <h4 className="font-bold text-[#262626] dark:text-[#fafafa] text-sm mb-3 flex items-center gap-2">
                  <span className="text-lg">🤖</span> Android (Chrome)
                </h4>
                <ol className="space-y-2 text-sm text-[#262626] dark:text-[#e5e5e5]">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-xs font-bold">1</span>
                    <span>Відкрийте сайт у <strong>Chrome</strong>.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-xs font-bold">2</span>
                    <span>Натисніть <strong>меню</strong> (три крапки <span className="inline-block w-4 h-4 border border-current rounded-sm align-middle" /> у правому верхньому куті).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-xs font-bold">3</span>
                    <span>Виберіть <strong>«Встановити додаток»</strong> або <strong>«Додати на головний екран»</strong>.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center text-xs font-bold">4</span>
                    <span>Підтвердіть — іконка з’явиться на екрані домівки.</span>
                  </li>
                </ol>
              </div>

              {(ios || android) && (
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3] text-center">
                  Для вашого пристрою ({ios ? 'iOS' : 'Android'}) використовуйте інструкцію вище.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
