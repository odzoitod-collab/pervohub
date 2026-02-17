import React, { useState } from 'react';
import { LostItem, User, isSchoolAdmin } from '../types';
import { MapPin, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from './Button';

interface LostFoundCardProps {
  item: LostItem;
  currentUser?: User | null;
  onImageClick: (url: string) => void;
  onMarkFound?: (item: LostItem) => void;
  onDelete?: (item: LostItem) => void;
}

export const LostFoundCard: React.FC<LostFoundCardProps> = ({
  item,
  currentUser,
  onImageClick,
  onMarkFound,
  onDelete
}) => {
  const [loading, setLoading] = useState(false);
  const isFound = item.status === 'found';
  const canManage = currentUser && (currentUser.id === item.author.id || isSchoolAdmin(currentUser.role));

  return (
    <div className="bg-white dark:bg-[#171717] rounded-2xl overflow-hidden border border-[#efefef] dark:border-[#404040] mb-4 transition-all">
      {/* Header Badge */}
      <div className={`px-4 py-3 flex items-center justify-between ${isFound ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-700' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-b border-rose-100 dark:border-rose-800'}`}>
        <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
          {isFound ? (
            <>
              <CheckCircle2 size={16} /> Знайдено / Повернено
            </>
          ) : (
            <>
              <AlertCircle size={16} /> Шукаю
            </>
          )}
        </div>
        <span className="text-[10px] font-medium opacity-80">{item.date}</span>
      </div>

      <div className="p-4">
        <div className="flex gap-4">
          {/* Image Thumbnail */}
          <div className="w-28 h-28 flex-shrink-0 bg-slate-100 dark:bg-[#262626] rounded-xl overflow-hidden border border-slate-100 dark:border-[#404040] cursor-pointer hover:ring-2 hover:ring-indigo-200 dark:hover:ring-indigo-600 transition-all">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover"
              onClick={() => onImageClick(item.image)}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-[#fafafa] mb-1.5 text-base">{item.title}</h3>
            <p className="text-sm text-slate-600 dark:text-[#a3a3a3] mb-3 line-clamp-3">{item.description}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-[#a3a3a3]">
              <div className="flex items-center gap-1.5">
                <img src={item.author.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                <span className="font-medium text-slate-700 dark:text-[#e5e5e5]">{item.author.name}</span>
                {item.author.grade && (
                  <span className="text-slate-400">• {item.author.grade}</span>
                )}
              </div>
              {item.contactInfo && (
                <div className="flex items-center gap-1 text-slate-400">
                  <MapPin size={12} />
                  <span>{item.contactInfo}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Author or Admin */}
        {canManage && (onMarkFound || onDelete) && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            {!isFound && onMarkFound && (
              <Button
                variant="secondary"
                className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await onMarkFound(item);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <CheckCircle2 size={16} />
                Позначити як знайдено
              </Button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
              >
                <Trash2 size={16} />
                Видалити
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};