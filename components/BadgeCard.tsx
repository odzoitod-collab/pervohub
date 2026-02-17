import React from 'react';
import type { Badge, UserBadgeGroup } from '../types';

interface BadgeCardProps {
  group: UserBadgeGroup;
  onClick?: () => void;
  className?: string;
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

export const BadgeCard: React.FC<BadgeCardProps> = ({ group, onClick, className = '' }) => {
  const { badge, count } = group;
  const isLegendary = badge.rarity === 'legendary';

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${badge.name} (${badge.rarity})`}
      className={`
        relative w-12 h-12 min-w-[3rem] min-h-[3rem] rounded-full overflow-hidden
        flex items-center justify-center
        transition-all duration-200 hover:scale-110 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent
        ${className}
      `}
      style={{
        background: `linear-gradient(135deg, ${badge.color_from}, ${badge.color_to})`,
        boxShadow: isLegendary
          ? `0 0 16px ${badge.color_to}60, 0 4px 12px rgba(0,0,0,0.2)`
          : '0 4px 12px rgba(0,0,0,0.18)'
      }}
    >
      {isLegendary && (
        <div
          className="absolute inset-0 rounded-full animate-pulse opacity-50 pointer-events-none"
          style={{ boxShadow: `inset 0 0 20px ${badge.color_to}50` }}
          aria-hidden
        />
      )}
      <div
        className="absolute inset-0 rounded-full pointer-events-none border-2 border-white/40"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.08)' }}
        aria-hidden
      />
      {count > 1 && (
        <div className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] rounded-full bg-white/90 border border-white flex items-center justify-center">
          <span className="text-[10px] font-bold text-[#262626]">×{count}</span>
        </div>
      )}
      <div className="relative z-10 flex items-center justify-center">
        {isEmoji(badge.icon) ? (
          <span className="text-2xl leading-none" role="img" aria-hidden>{badge.icon}</span>
        ) : (
          <img src={badge.icon} alt="" className="w-6 h-6 object-contain" />
        )}
      </div>
    </button>
  );
};
