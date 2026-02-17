import React, { useState } from 'react';
import { X, Send, MessageSquare, Trash2 } from 'lucide-react';
import { Post, Comment, User, isSchoolAdmin } from '../types';

interface CommentModalProps {
  post: Post | null;
  currentUser: User;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  onDeleteComment: (commentId: string, postId: string) => void;
  onUserClick: (user: User) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ post, currentUser, onClose, onAddComment, onDeleteComment, onUserClick }) => {
  const [text, setText] = useState('');

  if (!post) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) {
      onAddComment(post.id, trimmed);
      setText('');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-center items-end md:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 bg-white dark:bg-[#171717] w-full md:max-w-lg h-[80vh] md:h-[600px] rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header — p-4, divider border-gray-100, close 44x44 */}
        <div className="p-4 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-[#262626] dark:text-[#fafafa] text-[15px]">Коментарі ({post.commentsCount})</h3>
          <button type="button" onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-[#737373] dark:text-[#a3a3a3] hover:bg-[#efefef] dark:hover:bg-[#262626] active:scale-95 transition-all touch-manipulation" aria-label="Закрити">
            <X size={20} />
          </button>
        </div>

        {/* Comments — месенджер: свої праворуч (accent), чужі ліворуч (#efefef), max-w-[80%] */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {(!post.commentsData || post.commentsData.length === 0) ? (
             <div className="h-full flex flex-col items-center justify-center text-[#8e8e8e] dark:text-[#a3a3a3]">
                <MessageSquare size={48} className="mb-2 opacity-20" />
                <p className="text-sm">Поки немає коментарів. Будь першим!</p>
             </div>
          ) : (
            post.commentsData.map((comment) => {
              const canDeleteComment = currentUser.id === comment.author.id || isSchoolAdmin(currentUser.role);
              const isOwn = comment.author.id === currentUser.id;
              return (
                <div key={comment.id} className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <button type="button" onClick={() => onUserClick(comment.author)} className="min-w-10 min-h-10 flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden focus:outline-none active:scale-95 touch-manipulation">
                    <img src={comment.author.avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-[#efefef] dark:ring-[#404040]" alt="" />
                  </button>
                  <div className={`flex flex-col max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-3 rounded-2xl ${isOwn ? 'rounded-tr-none bg-[#0095f6] text-white' : 'rounded-tl-none bg-[#efefef] dark:bg-[#262626] text-[#262626] dark:text-[#e5e5e5]'}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <button type="button" onClick={() => onUserClick(comment.author)} className={`text-xs font-semibold truncate max-w-[120px] ${isOwn ? 'text-white/90 hover:underline' : 'text-[#262626] dark:text-[#fafafa] hover:underline'}`}>
                          {comment.author.name}
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`text-[10px] ${isOwn ? 'text-white/80' : 'text-[#8e8e8e] dark:text-[#a3a3a3]'}`}>{comment.timestamp}</span>
                          {canDeleteComment && (
                            <button
                              type="button"
                              onClick={() => onDeleteComment(comment.id, post.id)}
                              className="min-w-8 min-h-8 flex items-center justify-center rounded text-[#8e8e8e] dark:text-[#a3a3a3] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                              title="Видалити коментар"
                              aria-label="Видалити"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm leading-relaxed ${isOwn ? 'text-white' : ''}`}>{comment.text}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input — p-4, border-t border-gray-100, send button 44x44, safe-area-pb */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 dark:border-[#262626] bg-white dark:bg-[#171717] flex-shrink-0 safe-area-pb">
           <div className="relative flex items-center">
             <input 
               type="text" 
               value={text}
               onChange={(e) => setText(e.target.value)}
               placeholder="Напиши коментар..."
               className="w-full bg-[#efefef] dark:bg-[#262626] border-0 rounded-full py-3 pl-4 pr-14 text-[14px] focus:ring-2 focus:ring-[#0095f6]/50 focus:outline-none text-[#262626] dark:text-[#fafafa] placeholder-[#8e8e8e] dark:placeholder-[#a3a3a3]"
             />
             <button 
               type="submit"
               disabled={!text.trim()}
               className="absolute right-1 min-w-11 min-h-11 flex items-center justify-center bg-[#0095f6] text-white rounded-full disabled:opacity-50 disabled:bg-[#c7c7c7] transition-all hover:bg-[#0084e0] active:scale-95 touch-manipulation"
               aria-label="Надіслати"
             >
               <Send size={18} />
             </button>
           </div>
        </form>
      </div>
    </div>
  );
};
