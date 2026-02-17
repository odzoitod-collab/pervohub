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
      {isOwnProfile && (
        <Button
          onClick={() => setShowAddModal(true)}
          className="w-full mb-4 gap-2"
        >
          <PlusCircle size={18} />
          Додати досягнення
        </Button>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#171717] rounded-2xl border border-[#efefef] dark:border-[#404040] border-dashed">
          <ImageIcon size={48} className="mx-auto text-slate-300 dark:text-[#404040] mb-3" />
          <p className="text-slate-500 dark:text-[#a3a3a3] font-medium mb-1">Портфоліо порожнє</p>
          <p className="text-sm text-slate-400 dark:text-[#737373] mb-4">
            {isOwnProfile ? 'Додайте сертифікати, пости чи стартапи' : 'У користувача ще немає досягнень'}
          </p>
          {isOwnProfile && (
            <Button variant="secondary" onClick={() => setShowAddModal(true)} className="gap-2">
              <PlusCircle size={16} /> Додати досягнення
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group bg-white dark:bg-[#171717] rounded-2xl border border-[#efefef] dark:border-[#404040] overflow-hidden aspect-square"
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold uppercase text-white/90">
                  {TYPE_LABELS[item.type] || item.type}
                </span>
                <p className="text-sm font-bold truncate">{item.title}</p>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deletingId === item.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
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
