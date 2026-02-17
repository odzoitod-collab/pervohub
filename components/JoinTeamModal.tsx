import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Startup } from '../types';
import * as api from '../services/api';

interface JoinTeamModalProps {
  startup: Startup;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export const JoinTeamModal: React.FC<JoinTeamModalProps> = ({
  startup,
  userId,
  onClose,
  onSuccess,
  onError
}) => {
  const [message, setMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async () => {
    setIsPending(true);
    try {
      await api.createTeamRequest(startup.id, userId, message);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('JoinTeamModal:', err);
      if (err?.message?.includes('duplicate') || err?.code === '23505') {
        onError('Ви вже подали заявку на цей стартап');
      } else {
        onError('Не вдалося відправити заявку. Спробуйте ще раз.');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#171717] w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl p-6 animate-slide-up border border-[#efefef] dark:border-[#404040]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#fafafa]">Хочу в команду</h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-[#262626] rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-[#404040]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-slate-600 dark:text-[#a3a3a3] text-sm mb-4">
          {startup.title}
        </p>

        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-[#a3a3a3] uppercase ml-1 block mb-2">
            Як я можу допомогти?
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Опишіть, чим можете бути корисні..."
            className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-xl p-4 text-sm min-h-[100px] focus:ring-2 focus:ring-[#0095f6] focus:outline-none resize-none text-slate-900 dark:text-[#fafafa] placeholder-slate-400 dark:placeholder-[#737373]"
            rows={4}
          />
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isPending}>
            Скасувати
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={isPending} isLoading={isPending}>
            {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Відправити заявку'}
          </Button>
        </div>
      </div>
    </div>
  );
};
