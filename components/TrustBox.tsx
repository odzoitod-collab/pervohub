import React, { useState, useEffect } from 'react';
import { Send, ShieldCheck, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { sendTrustMessage, fetchTrustMessages, TrustMessage } from '../services/api';
import { User } from '../types';
import { isSchoolAdmin } from '../types';

interface TrustBoxProps {
  currentUser?: User | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export const TrustBox: React.FC<TrustBoxProps> = ({ currentUser, onSuccess, onError }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<TrustMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const isAdmin = currentUser && isSchoolAdmin(currentUser.role);

  useEffect(() => {
    if (isAdmin) {
      setMessagesLoading(true);
      fetchTrustMessages()
        .then(setMessages)
        .catch(() => onError?.('Не вдалося завантажити повідомлення'))
        .finally(() => setMessagesLoading(false));
    }
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      await sendTrustMessage(message);
      setMessage('');
      onSuccess?.("Повідомлення надіслано анонімно");
      if (isAdmin) {
        const list = await fetchTrustMessages();
        setMessages(list);
      }
    } catch (e) {
      onError?.("Помилка відправки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 border border-[#efefef] dark:border-[#404040]">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldCheck size={24} />
        </div>
        <h2 className="text-xl font-semibold text-[#262626] dark:text-[#fafafa]">Скарбничка Довіри</h2>
        <p className="text-sm text-[#8e8e8e] dark:text-[#a3a3a3] mt-1 max-w-xs mx-auto">
          Напиши анонімне повідомлення психологу, дирекції або запропонуй ідею. Ми не зберігаємо твоє ім'я.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative mb-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Що тебе турбує? Або яка є ідея?"
            className="w-full p-4 bg-[#fafafa] dark:bg-[#262626] border border-[#efefef] dark:border-[#404040] rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:outline-none min-h-[150px] text-sm text-[#262626] dark:text-[#fafafa] placeholder-[#737373] dark:placeholder-[#a3a3a3] resize-none"
          />
        </div>

        <Button 
          type="submit" 
          disabled={!message.trim() || loading} 
          isLoading={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
        >
          <Send size={16} />
          Відправити Анонімно
        </Button>
      </form>

      {isAdmin && (
        <div className="mt-8 pt-6 border-t border-[#efefef] dark:border-[#404040]">
          <h3 className="font-semibold text-[#262626] dark:text-[#fafafa] mb-3 flex items-center gap-2">
            <Inbox size={18} /> Повідомлення учнів
          </h3>
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-[#8e8e8e] dark:text-[#a3a3a3] py-4">Поки немає повідомлень</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#fafafa] dark:bg-[#262626] rounded-xl p-4 border border-[#efefef] dark:border-[#404040] text-sm text-[#262626] dark:text-[#fafafa]"
                >
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  <p className="text-xs text-[#8e8e8e] dark:text-[#a3a3a3] mt-2">{m.created_at}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};