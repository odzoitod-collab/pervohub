import React from 'react';
import { X } from 'lucide-react';
import type { UserBadgeGroup } from '../types';

interface BadgeHistoryModalProps {
  group: UserBadgeGroup;
  onClose: () => void;
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

export const BadgeHistoryModal: React.FC<BadgeHistoryModalProps> = ({ group, onClose }) => {
  const { badge, items } = group;

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true" aria-labelledby="badge-history-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0" onClick={onClose} aria-hidden="true" />
      <div
        className="relative z-10 bg-white dark:bg-[#171717] w-full md:max-w-md max-h-[90vh] rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col animate-slide-up md:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-100 dark:border-[#262626]">
          <h2 id="badge-history-title" className="text-lg font-bold text-[#262626] dark:text-[#fafafa]">Історія відзнаки</h2>
          <button type="button" onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-[#737373] dark:text-[#a3a3a3] hover:bg-[#efefef] dark:hover:bg-[#262626] active:scale-95 touch-manipulation" aria-label="Закрити">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Велике зображення відзнаки + опис */}
          <div
            className="flex flex-col items-center p-6 text-center"
            style={{
              background: `linear-gradient(180deg, ${badge.color_from}22 0%, transparent 70%)`
            }}
          >
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${badge.color_from}, ${badge.color_to})`
              }}
            >
              {isEmoji(badge.icon) ? (
                <span className="text-5xl" role="img">{badge.icon}</span>
              ) : (
                <img src={badge.icon} alt="" className="w-14 h-14 object-contain" />
              )}
            </div>
            <h3 className="text-xl font-bold text-[#262626] dark:text-[#fafafa] mb-1">{badge.name}</h3>
            <p className="text-xs font-medium text-[#8e8e8e] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">{badge.rarity}</p>
            {badge.description && (
              <p className="text-sm text-[#525252] dark:text-[#a3a3a3] max-w-xs">{badge.description}</p>
            )}
          </div>

          {/* Timeline / список отримань */}
          <div className="px-4 pb-6">
            <h4 className="text-sm font-bold text-[#262626] dark:text-[#fafafa] mb-3">Коли отримано</h4>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 p-3 rounded-xl bg-[#fafafa] dark:bg-[#262626]">
                  <img
                    src={item.awarder?.avatar ?? 'https://api.dicebear.com/7.x/initials/svg?seed=teacher'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-[#efefef] dark:ring-[#404040]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#262626] dark:text-[#fafafa] truncate">
                      {item.awarder?.name ?? 'Вчитель'}
                    </p>
                    <p className="text-sm text-[#525252] dark:text-[#a3a3a3] line-clamp-2">{item.comment}</p>
                    <p className="text-xs text-[#737373] dark:text-[#737373] mt-1">
                      {new Date(item.created_at).toLocaleDateString('uk-UA', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
