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
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full md:max-w-lg h-[80vh] md:h-[600px] rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-[#efefef] flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-[#262626] text-lg">Коментарі ({post.commentsCount})</h3>
          <button onClick={onClose} className="p-2 bg-[#efefef] rounded-full text-[#8e8e8e] hover:bg-[#e0e0e0]">
            <X size={20} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {(!post.commentsData || post.commentsData.length === 0) ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <MessageSquare size={48} className="mb-2 opacity-20" />
                <p className="text-sm">Поки немає коментарів. Будь першим!</p>
             </div>
          ) : (
            post.commentsData.map(comment => {
              const canDeleteComment = currentUser.id === comment.author.id || isSchoolAdmin(currentUser.role);
              return (
                <div key={comment.id} className="flex gap-3 group">
                  <button onClick={() => onUserClick(comment.author)} className="flex-shrink-0">
                    <img src={comment.author.avatar} className="w-8 h-8 rounded-full object-cover ring-2 ring-[#efefef]" alt="" />
                  </button>
                  <div className="bg-[#efefef] p-3 rounded-2xl rounded-tl-none flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <button onClick={() => onUserClick(comment.author)} className="text-xs font-semibold text-[#262626] hover:underline truncate">
                        {comment.author.name}
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                        {canDeleteComment && (
                          <button
                            onClick={() => onDeleteComment(comment.id, post.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Видалити коментар"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-[#efefef] bg-white flex-shrink-0 safe-area-pb">
           <div className="relative">
             <input 
               type="text" 
               value={text}
               onChange={(e) => setText(e.target.value)}
               placeholder="Напиши коментар..."
               className="w-full bg-[#efefef] border-0 rounded-full py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-[#0095f6]/50 focus:outline-none text-[#262626] placeholder-[#8e8e8e]"
             />
             <button 
               type="submit"
               disabled={!text.trim()}
               className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#0095f6] text-white rounded-full disabled:opacity-50 disabled:bg-[#c7c7c7] transition-all hover:bg-[#0084e0]"
             >
               <Send size={16} />
             </button>
           </div>
        </form>
      </div>
    </div>
  );
};