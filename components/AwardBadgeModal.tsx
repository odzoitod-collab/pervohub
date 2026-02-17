import React, { useState, useEffect } from 'react';
import { X, Loader2, Award } from 'lucide-react';
import * as api from '../services/api';
import type { Badge, BadgeRarity, User } from '../types';
import { Button } from './Button';

const RARITY_ORDER: BadgeRarity[] = ['common', 'rare', 'epic', 'legendary'];
const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Звичайні',
  rare: 'Рідкісні',
  epic: 'Епічні',
  legendary: 'Легендарні'
};

interface AwardBadgeModalProps {
  student: User;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function isEmoji(icon: string): boolean {
  if (!icon || icon.length > 4) return false;
  const codePoint = icon.codePointAt(0);
  return typeof codePoint === 'number' && (
    (codePoint >= 0x1F300 && codePoint <= 0x1F9FF) ||
    (codePoint >= 0x2600 && codePoint <= 0x26FF) ||
    (codePoint >= 0x2700 && codePoint <= 0x27BF) ||
    codePoint < 0x100
  );
}

export const AwardBadgeModal: React.FC<AwardBadgeModalProps> = ({
  student,
  currentUser,
  onClose,
  onSuccess,
  onError
}) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.fetchBadges();
        if (!cancelled) setBadges(list);
      } catch (e) {
        if (!cancelled) onError('Не вдалося завантажити відзнаки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onError]);

  const byRarity = RARITY_ORDER.map((rarity) => ({
    rarity,
    label: RARITY_LABELS[rarity],
    list: badges.filter((b) => b.rarity === rarity)
  })).filter((section) => section.list.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBadge || !comment.trim()) {
      onError('Оберіть відзнаку та напишіть, за що нагороджуєте');
      return;
    }
    setSubmitting(true);
    try {
      await api.awardBadge(student.id, selectedBadge.id, currentUser.id, comment.trim());
      onSuccess();
      onClose();
    } catch (err) {
      onError('Не вдалося видати відзнаку. Спробуйте ще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true" aria-labelledby="award-badge-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0" onClick={onClose} aria-hidden="true" />
      <div
        className="relative z-10 bg-white dark:bg-[#171717] w-full md:max-w-lg max-h-[90vh] rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col animate-slide-up md:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-100 dark:border-[#262626]">
          <h2 id="award-badge-title" className="text-lg font-bold text-[#262626] dark:text-[#fafafa]">
            Нагородити: {student.name}
          </h2>
          <button type="button" onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-[#737373] dark:text-[#a3a3a3] hover:bg-[#efefef] dark:hover:bg-[#262626] active:scale-95 touch-manipulation" aria-label="Закрити">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto no-scrollbar p-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#0095f6]" size={32} />
              </div>
            ) : (
              <>
                {byRarity.map(({ rarity, label, list }) => (
                  <div key={rarity} className="mb-6">
                    <h3 className="text-xs font-bold text-[#8e8e8e] dark:text-[#a3a3a3] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Award size={14} />
                      {label}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {list.map((badge) => (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => setSelectedBadge(badge)}
                          className={`
                            w-20 h-20 rounded-xl flex flex-col items-center justify-center p-2
                            border-2 transition-all
                            ${selectedBadge?.id === badge.id
                              ? 'border-[#0095f6] ring-2 ring-[#0095f6]/30'
                              : 'border-[#efefef] dark:border-[#404040] hover:border-[#0095f6]/50'
                            }
                          `}
                          style={{
                            background: `linear-gradient(135deg, ${badge.color_from}40, ${badge.color_to}40)`
                          }}
                        >
                          {isEmoji(badge.icon) ? (
                            <span className="text-2xl" role="img">{badge.icon}</span>
                          ) : (
                            <img src={badge.icon} alt="" className="w-8 h-8 object-contain" />
                          )}
                          <span className="text-[10px] font-semibold text-[#262626] dark:text-[#fafafa] truncate w-full text-center mt-1">
                            {badge.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="mt-4">
              <label htmlFor="award-comment" className="block text-sm font-bold text-[#262626] dark:text-[#fafafa] mb-2">
                За що нагороджуєте? <span className="text-[#ed4956]">*</span>
              </label>
              <textarea
                id="award-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Наприклад: за активність на уроці математики"
                rows={3}
                className="w-full bg-[#fafafa] dark:bg-[#262626] border border-[#efefef] dark:border-[#404040] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0095f6] focus:outline-none text-[#262626] dark:text-[#fafafa] placeholder-[#a3a3a3] resize-none"
                required
              />
            </div>
          </div>

          <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-[#262626]">
            <Button type="submit" disabled={!selectedBadge || !comment.trim() || submitting} isLoading={submitting} className="w-full">
              Відправити відзнаку
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
