import React, { useState, useEffect } from 'react';
import { Heart, Loader2, X } from 'lucide-react';
import * as api from '../services/api';
import type { TeacherThank } from '../types';

interface TeacherThanksSectionProps {
  teacherId: string;
  refreshTrigger?: number;
  onViewModalChange?: (open: boolean) => void;
  className?: string;
}

const CARD_GRADIENT = { from: '#fda4af', to: '#fb7185' }; // rose-300 → rose-400, NFT-стиль

export const TeacherThanksSection: React.FC<TeacherThanksSectionProps> = ({
  teacherId,
  refreshTrigger = 0,
  onViewModalChange,
  className = ''
}) => {
  const [thanks, setThanks] = useState<TeacherThank[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const setViewModalOpenAndNotify = (open: boolean) => {
    setViewModalOpen(open);
    onViewModalChange?.(open);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.fetchTeacherThanks(teacherId).then((list) => {
      if (!cancelled) setThanks(list);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [teacherId, refreshTrigger]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-6 ${className}`}>
        <Loader2 className="animate-spin text-rose-500" size={24} />
      </div>
    );
  }

  if (thanks.length === 0) return null;

  return (
    <>
      <section className={`${className}`} aria-label="Подяки від учнів">
        <button
          type="button"
          onClick={() => setViewModalOpenAndNotify(true)}
          className="flex items-center gap-2 mb-3 w-full text-left focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 dark:focus:ring-offset-[#171717] rounded-lg -mx-1 px-1 py-0.5"
        >
          <Heart size={18} className="text-rose-500 flex-shrink-0" />
          <h3 className="text-sm font-bold text-[#262626] dark:text-[#fafafa]">Подяки від учнів</h3>
          <span className="text-xs text-[#737373] dark:text-[#a3a3a3] ml-1">({thanks.length})</span>
        </button>
        <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-2 pb-2 -mx-1 px-1">
          {thanks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setViewModalOpenAndNotify(true)}
              className="snap-center flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 dark:focus:ring-offset-[#171717]"
              title={`${t.from_user.name}${t.message ? `: ${t.message}` : ''} · ${t.created_at}`}
            >
              <div
                className="relative w-12 h-12 min-w-[3rem] min-h-[3rem] rounded-full overflow-hidden flex items-center justify-center ring-2 ring-white/40"
                style={{
                  background: `linear-gradient(135deg, ${CARD_GRADIENT.from}, ${CARD_GRADIENT.to})`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)'
                }}
              >
                <img src={t.from_user.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {viewModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true" aria-labelledby="view-thanks-title">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0" onClick={() => setViewModalOpenAndNotify(false)} aria-hidden="true" />
          <div
            className="relative z-10 bg-white dark:bg-[#171717] w-full md:max-w-md max-h-[90vh] rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col animate-slide-up md:animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-100 dark:border-[#262626]">
              <h2 id="view-thanks-title" className="text-lg font-bold text-[#262626] dark:text-[#fafafa] flex items-center gap-2">
                <Heart size={20} className="text-rose-500" />
                Подяки від учнів
              </h2>
              <button type="button" onClick={() => setViewModalOpenAndNotify(false)} className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-[#737373] dark:text-[#a3a3a3] hover:bg-[#efefef] dark:hover:bg-[#262626] active:scale-95 touch-manipulation" aria-label="Закрити">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4">
              <ul className="space-y-3">
                {thanks.map((t) => (
                  <li key={t.id} className="flex gap-3 p-3 rounded-xl bg-[#fafafa] dark:bg-[#262626]">
                    <img
                      src={t.from_user.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-[#efefef] dark:ring-[#404040]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#262626] dark:text-[#fafafa]">
                        {t.from_user.name}
                        {t.from_user.grade && <span className="text-[#737373] dark:text-[#a3a3a3] font-normal"> · {t.from_user.grade}</span>}
                      </p>
                      {t.message && <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mt-1 whitespace-pre-wrap break-words">{t.message}</p>}
                      <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-1">{t.created_at}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
