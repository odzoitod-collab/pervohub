import React, { useState } from 'react';
import { Startup, User, isSchoolAdmin, StartupTeamRequest } from '../types';
import { Rocket, ThumbsUp, CheckCircle2, XCircle, Trash2, Loader2, Users } from 'lucide-react';
import { Button } from './Button';

interface StartupCardProps {
  startup: Startup;
  currentUser?: User | null;
  isVoted?: boolean;
  myTeamRequest?: StartupTeamRequest | null;
  pendingRequestsCount?: number;
  onVote?: (startup: Startup) => void;
  onAccept?: (startup: Startup) => void;
  onReject?: (startup: Startup) => void;
  onDelete?: (startup: Startup) => void;
  onJoinTeam?: (startup: Startup) => void;
  onOpenTeamRequests?: (startup: Startup) => void;
}

export const StartupCard: React.FC<StartupCardProps> = ({
  startup,
  currentUser,
  isVoted = false,
  myTeamRequest,
  pendingRequestsCount = 0,
  onVote,
  onAccept,
  onReject,
  onDelete,
  onJoinTeam,
  onOpenTeamRequests
}) => {
  const [loading, setLoading] = useState(false);
  const percentage = Math.min(100, Math.round((startup.currentSupport / Math.max(1, startup.goal)) * 100));
  const isAccepted = startup.status === 'accepted';
  const isPending = startup.status === 'pending';
  const isAdmin = currentUser && isSchoolAdmin(currentUser.role);
  const isAuthor = currentUser && startup.author.id === currentUser.id;

  return (
    <div className={`bg-white dark:bg-[#171717] rounded-2xl p-5 mb-4 border transition-all group ${
      isAccepted ? 'border-emerald-200 dark:border-emerald-700' : 'border-[#efefef] dark:border-[#404040]'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <div className="bg-[#e0f4ff] dark:bg-indigo-900/30 p-1.5 rounded-lg text-[#0095f6] dark:text-indigo-400">
            <Rocket size={16} />
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">Стартап</span>
          {isAccepted && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={12} /> Прийнято
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 dark:text-[#a3a3a3]">{startup.author.name} • {startup.author.grade}</span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-[#fafafa] mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {startup.title}
      </h3>
      
      <p className="text-sm text-slate-600 dark:text-[#a3a3a3] mb-4 leading-relaxed">
        {startup.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {startup.tags.map(tag => (
          <span key={tag} className="text-[10px] px-2 py-1 bg-slate-50 dark:bg-[#262626] text-slate-500 dark:text-[#a3a3a3] rounded-md border border-slate-100 dark:border-[#404040]">
            #{tag}
          </span>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-[#262626] rounded-xl p-3 mb-4 border border-slate-100 dark:border-[#404040]">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="font-medium text-slate-700 dark:text-[#a3a3a3]">Підтримка (голосів)</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{startup.currentSupport} / {startup.goal}</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-[#404040] rounded-full h-2 overflow-hidden">
          <div 
            className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {currentUser && onVote && (
          <Button
            variant="secondary"
            className={`w-full gap-2 ${isVoted ? 'bg-[#e0f4ff] text-[#0095f6] border-[#0095f6]/30' : ''}`}
            onClick={async () => {
              setLoading(true);
              try {
                await onVote(startup);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} className={isVoted ? 'fill-current' : ''} />}
            {isVoted ? 'Відкликати голос' : 'Підтримати ідею'}
          </Button>
        )}

        {currentUser && !isAuthor && onJoinTeam && (
          <>
            {myTeamRequest ? (
              <div className={`text-center py-2 px-3 rounded-xl text-sm font-medium ${
                myTeamRequest.status === 'accepted'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : myTeamRequest.status === 'rejected'
                  ? 'bg-slate-100 dark:bg-[#262626] text-slate-500 dark:text-[#a3a3a3]'
                  : 'bg-[#e0f4ff] dark:bg-indigo-900/30 text-[#0095f6] dark:text-indigo-400'
              }`}>
                {myTeamRequest.status === 'accepted'
                  ? 'Вас прийнято в команду'
                  : myTeamRequest.status === 'rejected'
                  ? 'Заявку відхилено'
                  : 'Заявку надіслано'}
              </div>
            ) : (
              <Button
                className="w-full gap-2"
                onClick={() => onJoinTeam(startup)}
              >
                <Users size={16} />
                Хочу в команду
              </Button>
            )}
          </>
        )}

        {isAuthor && onOpenTeamRequests && (
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={() => onOpenTeamRequests(startup)}
          >
            <Users size={16} />
            Заявки в команду {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
          </Button>
        )}

        {isAdmin && isPending && (onAccept || onReject || onDelete) && (
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            {onAccept && (
              <Button
                className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2"
                onClick={() => onAccept(startup)}
              >
                <CheckCircle2 size={14} /> Прийняти
              </Button>
            )}
            {onReject && (
              <Button
                variant="secondary"
                className="flex-1 gap-1 text-amber-700 border-amber-200 hover:bg-amber-50 text-sm py-2"
                onClick={() => onReject(startup)}
              >
                <XCircle size={14} /> Відхилити
              </Button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(startup)}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Видалити"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};