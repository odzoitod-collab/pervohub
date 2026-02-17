import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, Trash2, ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { PortfolioItem, User } from '../types';
import * as api from '../services/api';
import { AddPortfolioModal } from './AddPortfolioModal';

const TYPE_LABELS: Record<string, string> = {
  post: 'Пост',
  startup: 'Стартап',
  certificate: 'Сертифікат'
};

interface PortfolioTabProps {
  user: User;
  isOwnProfile: boolean;
  onToast: (type: 'success' | 'error', msg: string) => void;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  user,
  isOwnProfile,
  onToast
}) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.fetchPortfolioItems(user.id);
      setItems(data);
    } catch (err) {
      console.error('PortfolioTab load:', err);
      onToast('error', 'Не вдалося завантажити портфоліо');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [user.id]);

  const handleDelete = async (item: PortfolioItem) => {
    if (!confirm('Видалити це досягнення?')) return;
    setDeletingId(item.id);
    try {
      await api.deletePortfolioItem(item.id, user.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onToast('success', 'Досягнення видалено');
    } catch (err) {
      console.error('PortfolioTab delete:', err);
      onToast('error', 'Не вдалося видалити');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-[#0095f6]" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {isOwnProfile && items.length > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm font-semibold text-[#0095f6] hover:underline flex items-center gap-1.5"
          >
            <PlusCircle size={16} /> Додати
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-14 bg-[#fafafa] dark:bg-[#171717] rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-[#efefef] dark:bg-[#262626] flex items-center justify-center mx-auto mb-4">
            <ImageIcon size={28} className="text-[#c4c4c4] dark:text-[#404040]" />
          </div>
          <p className="text-[#262626] dark:text-[#fafafa] font-semibold mb-1">Портфоліо</p>
          <p className="text-sm text-[#737373] dark:text-[#a3a3a3] mb-4 max-w-xs mx-auto">
            {isOwnProfile ? 'Додайте сертифікати, пости чи стартапи — вони зʼявляться тут' : 'У користувача ще немає досягнень'}
          </p>
          {isOwnProfile && (
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <PlusCircle size={18} /> Додати досягнення
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group aspect-square bg-[#efefef] dark:bg-[#262626] overflow-hidden"
            >
              <div className="absolute inset-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-[#262626]">
                    <ImageIcon size={32} className="text-slate-300 dark:text-[#404040]" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[10px] font-semibold uppercase text-white/90">
                  {TYPE_LABELS[item.type] || item.type}
                </span>
                <p className="text-xs font-bold truncate">{item.title}</p>
              </div>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 text-white rounded-full hover:bg-rose-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 z-10"
                  aria-label="Видалити"
                >
                  {deletingId === item.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPortfolioModal
          userId={user.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadItems();
            onToast('success', 'Досягнення додано');
          }}
          onError={onToast}
        />
      )}
    </div>
  );
};
