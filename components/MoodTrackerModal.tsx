import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const MOODS = [
  { value: 'great', emoji: '🤩', label: 'Чудово' },
  { value: 'good', emoji: '🙂', label: 'Добре' },
  { value: 'neutral', emoji: '😐', label: 'Нормально' },
  { value: 'sad', emoji: '😔', label: 'Сумно' },
  { value: 'angry', emoji: '😡', label: 'Злість' }
] as const;

interface MoodTrackerModalProps {
  onSelect: (mood: string) => Promise<void>;
  onClose?: () => void;
}

export const MoodTrackerModal: React.FC<MoodTrackerModalProps> = ({
  onSelect,
  onClose
}) => {
  const [isPending, setIsPending] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = async (mood: string) => {
    if (isPending) return;
    setSelected(mood);
    setIsPending(true);
    try {
      await onSelect(mood);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 safe-area-pb">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#171717] w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-slide-up border border-[#efefef] dark:border-[#404040]">
        <h2 className="text-xl font-bold text-slate-900 dark:text-[#fafafa] text-center mb-2">
          Ранкове коло
        </h2>
        <p className="text-slate-600 dark:text-[#a3a3a3] text-center text-sm mb-6">
          Як ти сьогодні почуваєшся?
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {MOODS.map(({ value, emoji, label }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={isPending}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all min-w-[70px] ${
                selected === value
                  ? 'border-[#0095f6] bg-[#e0f4ff] dark:bg-indigo-900/30 scale-105'
                  : 'border-[#efefef] dark:border-[#404040] hover:border-[#0095f6]/50 hover:bg-slate-50 dark:hover:bg-[#262626]'
              } ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <span className="text-3xl">{emoji}</span>
              <span className="text-xs font-medium text-slate-600 dark:text-[#a3a3a3]">
                {label}
              </span>
            </button>
          ))}
        </div>

        {isPending && (
          <div className="flex justify-center mt-4">
            <Loader2 className="animate-spin text-[#0095f6]" size={24} />
          </div>
        )}
      </div>
    </div>
  );
};
