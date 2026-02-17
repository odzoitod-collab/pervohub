import React, { useState } from 'react';
import { X, Heart, Loader2 } from 'lucide-react';
import * as api from '../services/api';
import type { User } from '../types';
import { Button } from './Button';

interface ThankTeacherModalProps {
  teacher: User;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export const ThankTeacherModal: React.FC<ThankTeacherModalProps> = ({
  teacher,
  currentUser,
  onClose,
  onSuccess,
  onError
}) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.sendThankToTeacher(teacher.id, currentUser.id, message.trim());
      onSuccess();
      onClose();
    } catch {
      onError('Не вдалося надіслати подяку');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true" aria-labelledby="thank-teacher-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0" onClick={onClose} aria-hidden="true" />
      <div
        className="relative z-10 bg-white dark:bg-[#171717] w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up md:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-100 dark:border-[#262626]">
          <h2 id="thank-teacher-title" className="text-lg font-bold text-[#262626] dark:text-[#fafafa] flex items-center gap-2">
            <Heart size={20} className="text-rose-500" />
            Подяка вчителю
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-[#737373] dark:text-[#a3a3a3] hover:bg-[#efefef] dark:hover:bg-[#262626] active:scale-95 touch-manipulation"
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 flex-1">
            <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mb-3">
              Подяка для <span className="font-semibold text-[#262626] dark:text-[#fafafa]">{teacher.name}</span> від учнів. Залиш текст або надішли без нього.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напиши подяку вчителю (необовʼязково)"
              className="w-full min-h-[120px] p-4 rounded-xl bg-[#fafafa] dark:bg-[#262626] border border-[#efefef] dark:border-[#404040] text-[#262626] dark:text-[#fafafa] placeholder-[#737373] resize-none focus:ring-2 focus:ring-rose-500/50 focus:outline-none text-sm"
              maxLength={500}
            />
          </div>
          <div className="flex-shrink-0 p-4 border-t border-[#efefef] dark:border-[#262626]">
            <Button
              type="submit"
              disabled={submitting}
              isLoading={submitting}
              className="w-full bg-rose-500 hover:bg-rose-600 gap-2"
            >
              {!submitting && <Heart size={18} />}
              Надіслати подяку
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
