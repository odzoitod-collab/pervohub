import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Loader2 } from 'lucide-react';
import { Notification, Post, User } from '../types';
import { fetchUserNotifications } from '../services/api';

interface NotificationsScreenProps {
  currentUser: User;
  posts: Post[];
  onCommentClick: (post: Post) => void;
  onUserClick: (user: User) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  currentUser,
  posts,
  onCommentClick,
  onUserClick
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserNotifications(currentUser.id)
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [currentUser.id]);

  const handleNotificationClick = (n: Notification) => {
    const post = posts.find(p => p.id === n.postId);
    if (post) onCommentClick(post);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#0095f6]" size={32} />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-0 animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#262626] dark:text-[#fafafa] mb-1">Сповіщення</h2>
        <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">Лайки та коментарі до твоїх постів</p>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#171717] rounded-2xl border border-[#efefef] dark:border-[#404040] border-dashed">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#262626] flex items-center justify-center mb-4">
            <MessageSquare size={28} className="text-slate-400 dark:text-[#a3a3a3]" />
          </div>
          <h3 className="text-lg font-bold text-[#262626] dark:text-[#fafafa] mb-2">Поки немає сповіщень</h3>
          <p className="text-[#737373] dark:text-[#a3a3a3] text-sm max-w-xs">
            Коли хтось поставить лайк або залишить коментар під твоїм постом — вони зʼявляться тут
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className="w-full flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-[#171717] border border-[#efefef] dark:border-[#404040] hover:bg-[#fafafa] dark:hover:bg-[#262626] transition-colors text-left"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onUserClick(n.actor); }}
                className="flex-shrink-0"
              >
                <img
                  src={n.actor.avatar}
                  alt={n.actor.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#efefef] dark:ring-[#404040]"
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={(e) => { e.stopPropagation(); onUserClick(n.actor); }}
                    className="font-semibold text-[#262626] dark:text-[#fafafa] hover:underline"
                  >
                    {n.actor.name}
                  </button>
                  <span className="text-[#737373] dark:text-[#a3a3a3] text-sm">
                    {n.type === 'like' ? 'лайкнув(ла) твій пост' : 'прокоментував(ла) твій пост'}
                  </span>
                </div>
                {n.type === 'comment' && n.text && (
                  <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mt-1 line-clamp-2">«{n.text}»</p>
                )}
                {n.postPreview && (
                  <p className="text-xs text-[#8e8e8e] dark:text-[#737373] mt-1 truncate">Пост: {n.postPreview}</p>
                )}
                <p className="text-xs text-[#8e8e8e] dark:text-[#737373] mt-1">{n.timestamp}</p>
              </div>
              <div className="flex-shrink-0 mt-1">
                {n.type === 'like' ? (
                  <Heart size={20} className="text-rose-500 fill-rose-500" />
                ) : (
                  <MessageSquare size={20} className="text-[#0095f6]" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
