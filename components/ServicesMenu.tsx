import React from 'react';
import { User as UserIcon, MapPin, ShieldCheck, Clock, Shield } from 'lucide-react';

interface ServicesMenuProps {
  onNavigate: (target: 'profile' | 'lost_found' | 'trust_box' | 'schedule' | 'admin') => void;
  isAdmin?: boolean;
}

const baseMenuItems = [
  { id: 'profile' as const, icon: UserIcon, label: 'Профіль' },
  { id: 'schedule' as const, icon: Clock, label: 'Розклад дзвінків' },
  { id: 'lost_found' as const, icon: MapPin, label: 'Бюро знахідок' },
  { id: 'trust_box' as const, icon: ShieldCheck, label: 'Скарбничка довіри' }
];

const adminMenuItem = { id: 'admin' as const, icon: Shield, label: 'Панель адміністратора' };

export const ServicesMenu: React.FC<ServicesMenuProps> = ({ onNavigate, isAdmin }) => {
  const menuItems = [...baseMenuItems, ...(isAdmin ? [adminMenuItem] : [])];
  return (
  <div className="pb-24 md:pb-0 animate-fade-in max-w-xl">
    <div className="mb-6">
      <h2 className="text-xl font-bold text-[#262626] dark:text-[#fafafa] mb-1">Сервіси</h2>
      <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">Оберіть розділ</p>
    </div>
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#171717] shadow-sm">
      {menuItems.map(({ id, icon: Icon, label }, i) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`w-full flex items-center gap-4 p-4 hover:bg-[#fafafa] dark:hover:bg-[#262626] active:bg-[#f0f0f0] dark:active:bg-[#404040] transition-colors text-left ${i < menuItems.length - 1 ? 'border-b border-[#efefef] dark:border-[#262626]' : ''}`}
        >
          <Icon size={22} className="text-[#737373] dark:text-[#a3a3a3] flex-shrink-0" />
          <span className="font-semibold text-[#262626] dark:text-[#fafafa] flex-1 text-left">{label}</span>
        </button>
      ))}
    </div>
  </div>
  );
};
