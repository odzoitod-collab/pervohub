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
      className={`
        relative w-[140px] min-w-[140px] h-[180px] rounded-2xl overflow-hidden
        flex flex-col items-center justify-center p-4
        text-left
        transition-all duration-300 hover:scale-105 hover:-translate-y-1
        focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent
        ${className}
      `}
      style={{
        background: `linear-gradient(135deg, ${badge.color_from}, ${badge.color_to})`,
        boxShadow: isLegendary
          ? `0 0 30px ${badge.color_to}80, 0 8px 24px rgba(0,0,0,0.25)`
          : '0 8px 24px rgba(0,0,0,0.2)'
      }}
    >
      {isLegendary && (
        <div
          className="absolute inset-0 rounded-2xl animate-pulse opacity-60 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 40px ${badge.color_to}60`
          }}
          aria-hidden
        />
      )}
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] rounded-2xl pointer-events-none" aria-hidden />
      {/* Count badge — top right */}
      {count > 1 && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-white/25 backdrop-blur-md border border-white/30 shadow-lg">
          <span className="text-xs font-bold text-white drop-shadow">×{count}</span>
        </div>
      )}
      {/* Icon */}
      <div className="relative z-10 w-16 h-16 flex items-center justify-center mb-2 rounded-xl bg-black/10">
        {isEmoji(badge.icon) ? (
          <span className="text-4xl" role="img" aria-hidden>{badge.icon}</span>
        ) : (
          <img src={badge.icon} alt="" className="w-10 h-10 object-contain" />
        )}
      </div>
      <span className="relative z-10 text-sm font-bold text-white drop-shadow line-clamp-2 text-center leading-tight">
        {badge.name}
      </span>
      <span className="relative z-10 text-[10px] font-medium text-white/90 uppercase tracking-wider mt-0.5">
        {badge.rarity}
      </span>
    </button>
  );
};
