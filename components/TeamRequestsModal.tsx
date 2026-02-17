import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from './Button';
import { Startup, StartupTeamRequest, User } from '../types';
import * as api from '../services/api';

interface TeamRequestsModalProps {
  startup: Startup;
  currentUser: User;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const TeamRequestsModal: React.FC<TeamRequestsModalProps> = ({
  startup,
  currentUser,
  onClose,
  onSuccess,
  onError
}) => {
  const [requests, setRequests] = useState<(StartupTeamRequest & { applicant?: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.fetchTeamRequests(startup.id);
        setRequests(data);
      } catch (err) {
        console.error('TeamRequestsModal:', err);
        onError('Не вдалося завантажити заявки');
      } finally {
        setLoading(false);
      }
    })();
  }, [startup.id]);

  const handleStatus = async (req: StartupTeamRequest & { applicant?: User }, status: 'accepted' | 'rejected') => {
    setUpdatingId(req.id);
    try {
      await api.updateTeamRequestStatus(req.id, status, currentUser.id);
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status } : r))
      );
      onSuccess(status === 'accepted' ? 'Заявку прийнято' : 'Заявку відхилено');
    } catch (err) {
      console.error('TeamRequestsModal update:', err);
      onError('Не вдалося оновити');
    } finally {
      setUpdatingId(null);
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#171717] w-full md:max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl p-6 animate-slide-up border border-[#efefef] dark:border-[#404040] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#fafafa]">Заявки в команду</h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-[#262626] rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-[#404040]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-slate-600 dark:text-[#a3a3a3] text-sm mb-4 flex-shrink-0">{startup.title}</p>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#0095f6]" size={32} />
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-[#a3a3a3]">
              Немає нових заявок
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-[#efefef] dark:border-[#404040] bg-slate-50/50 dark:bg-[#262626]/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-[#fafafa]">
                        {req.applicant?.name || 'Користувач'}
                      </p>
                      {req.applicant?.grade && (
                        <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">{req.applicant.grade}</p>
                      )}
                      {req.message && (
                        <p className="text-sm text-slate-600 dark:text-[#a3a3a3] mt-1 italic">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleStatus(req, 'accepted')}
                        disabled={updatingId === req.id}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                        title="Прийняти"
                      >
                        {updatingId === req.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => handleStatus(req, 'rejected')}
                        disabled={updatingId === req.id}
                        className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors disabled:opacity-50"
                        title="Відхилити"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
