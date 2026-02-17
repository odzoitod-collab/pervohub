import React, { useState } from 'react';
import { X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { PortfolioItemType } from '../types';
import * as api from '../services/api';

const TYPE_LABELS: Record<PortfolioItemType, string> = {
  post: 'Пост',
  startup: 'Стартап',
  certificate: 'Сертифікат'
};

interface AddPortfolioModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export const AddPortfolioModal: React.FC<AddPortfolioModalProps> = ({
  userId,
  onClose,
  onSuccess,
  onError
}) => {
  const [type, setType] = useState<PortfolioItemType>('certificate');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      onError('Введіть назву досягнення');
      return;
    }
    if (type === 'certificate' && !file) {
      onError('Додайте фото сертифіката');
      return;
    }
    setIsPending(true);
    try {
      let imageUrl: string | null = null;
      if (file) {
        imageUrl = await api.uploadPortfolioImage(userId, file);
      }
      await api.createPortfolioItem(userId, {
        type,
        reference_id: null,
        title: title.trim(),
        image_url: imageUrl
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('AddPortfolioModal:', err);
      onError('Не вдалося додати. Спробуйте ще раз.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#171717] w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl p-6 animate-slide-up border border-[#efefef] dark:border-[#404040]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#fafafa]">Додати досягнення</h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-[#262626] rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-[#404040]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Тип</label>
            <div className="flex gap-2 flex-wrap">
              {(['certificate', 'post', 'startup'] as PortfolioItemType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    type === t
                      ? 'bg-[#0095f6] text-white'
                      : 'bg-[#efefef] dark:bg-[#262626] text-[#8e8e8e] dark:text-[#a3a3a3] hover:bg-[#e0e0e0] dark:hover:bg-[#404040]'
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Назва</label>
            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0095f6] focus:outline-none text-slate-900 dark:text-[#fafafa] placeholder-slate-400"
              placeholder="Наприклад: Сертифікат з англійської"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Фото</label>
            <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 dark:bg-[#262626] border-2 border-dashed border-slate-200 dark:border-[#404040] rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-[#404040] transition-colors">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <ImageIcon size={32} className="text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500 dark:text-[#a3a3a3] font-medium">Натисніть для завантаження</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isPending}>
            Скасувати
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={isPending} isLoading={isPending}>
            {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Додати'}
          </Button>
        </div>
      </div>
    </div>
  );
};
