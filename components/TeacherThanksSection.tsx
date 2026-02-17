import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import * as api from '../services/api';
import type { TeacherThank } from '../types';

interface TeacherThanksSectionProps {
  teacherId: string;
  refreshTrigger?: number;
  className?: string;
}

const CARD_GRADIENT = { from: '#fda4af', to: '#fb7185' }; // rose-300 → rose-400, NFT-стиль

export const TeacherThanksSection: React.FC<TeacherThanksSectionProps> = ({
  teacherId,
  refreshTrigger = 0,
  className = ''
}) => {
  const [thanks, setThanks] = useState<TeacherThank[]>([]);
  const [loading, setLoading] = useState(true);

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
    <section className={`${className}`} aria-label="Подяки від учнів">
      <div className="flex items-center gap-2 mb-3">
        <Heart size={18} className="text-rose-500" />
        <h3 className="text-sm font-bold text-[#262626] dark:text-[#fafafa]">Подяки від учнів</h3>
      </div>
      <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-2 pb-2 -mx-1 px-1">
        {thanks.map((t) => (
          <div key={t.id} className="snap-center flex-shrink-0" title={`${t.from_user.name}${t.message ? `: ${t.message}` : ''} · ${t.created_at}`}>
            <div
              className="relative w-12 h-12 min-w-[3rem] min-h-[3rem] rounded-full overflow-hidden flex items-center justify-center ring-2 ring-white/40"
              style={{
                background: `linear-gradient(135deg, ${CARD_GRADIENT.from}, ${CARD_GRADIENT.to})`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)'
              }}
            >
              <img src={t.from_user.avatar} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
