import React, { useState } from 'react';
import { useUserBadges } from '../hooks/useUserBadges';
import type { UserBadgeGroup } from '../types';
import { BadgeCard } from './BadgeCard';
import { BadgeHistoryModal } from './BadgeHistoryModal';
import { Loader2, Award } from 'lucide-react';

interface ProfileBadgesProps {
  userId: string;
  refreshTrigger?: number;
  className?: string;
}

export const ProfileBadges: React.FC<ProfileBadgesProps> = ({ userId, refreshTrigger = 0, className = '' }) => {
  const { groups, loading, error } = useUserBadges(userId, refreshTrigger);
  const [selectedGroup, setSelectedGroup] = useState<UserBadgeGroup | null>(null);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="animate-spin text-[#0095f6]" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-6 text-[#737373] dark:text-[#a3a3a3] text-sm ${className}`}>
        Не вдалося завантажити відзнаки
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={`py-6 ${className}`}>
        <div className="flex items-center gap-2 text-[#8e8e8e] dark:text-[#a3a3a3] text-sm">
          <Award size={18} />
          <span>Відзнак поки немає</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className={`${className}`} aria-label="Відзнаки">
        <div className="flex items-center gap-2 mb-3">
          <Award size={18} className="text-[#0095f6]" />
          <h3 className="text-sm font-bold text-[#262626] dark:text-[#fafafa]">Відзнаки</h3>
        </div>
        <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-4 pb-2 -mx-1 px-1">
          {groups.map((group) => (
            <div key={group.badge.id} className="snap-center flex-shrink-0">
              <BadgeCard
                group={group}
                onClick={() => setSelectedGroup(group)}
              />
            </div>
          ))}
        </div>
      </section>
      {selectedGroup && (
        <BadgeHistoryModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </>
  );
};
