import React, { useState } from 'react';
import { Post, User, UserRole, isSchoolAdmin } from '../types';
import { MessageSquare, Heart, AlertCircle, Trash2, MoreVertical } from 'lucide-react';

interface PostCardProps {
  post: Post;
  isLiked?: boolean;
  currentUser?: User | null;
  onUserClick: (user: User) => void;
  onCommentClick: (post: Post) => void;
  onImageClick: (imageUrl: string) => void;
  onLikeClick?: (post: Post) => void;
  onDeletePost?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, isLiked = false, currentUser, onUserClick, onCommentClick, onImageClick, onLikeClick, onDeletePost }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isDirector = post.author.role === UserRole.DIRECTOR || post.author.role === UserRole.SCHOOL_ADMIN;
  const canDelete = currentUser && onDeletePost && (
    currentUser.id === post.author.id ||
    isSchoolAdmin(currentUser.role)
  );

  // Function to render images based on count
  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    if (post.images.length === 1) {
      return (
        <div className="mt-2 md:mt-3 rounded-none md:rounded-xl overflow-hidden">
          <img 
            src={post.images[0]} 
            alt="Post content" 
            className="w-full h-auto object-cover max-h-[70vh] md:max-h-[400px] cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onImageClick(post.images![0])}
          />
        </div>
      );
    }

    if (post.images.length === 2) {
      return (
        <div className="mt-2 md:mt-3 grid grid-cols-2 gap-0.5 md:gap-1 rounded-none md:rounded-xl overflow-hidden">
          {post.images.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt={`Post content ${idx}`} 
              className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => onImageClick(img)}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="mt-2 md:mt-3 grid grid-cols-2 gap-0.5 md:gap-1 rounded-none md:rounded-xl overflow-hidden">
        <img 
            src={post.images[0]} 
            className="w-full h-64 object-cover col-span-2 cursor-pointer"
            onClick={() => onImageClick(post.images![0])}
        />
        <img 
            src={post.images[1]} 
            className="w-full h-32 object-cover cursor-pointer"
            onClick={() => onImageClick(post.images![1])}
        />
        <div className="relative w-full h-32 cursor-pointer" onClick={() => onImageClick(post.images![2])}>
            <img 
                src={post.images[2]} 
                className="w-full h-32 object-cover"
            />
            {post.images.length > 3 && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white font-bold text-lg">
                    +{post.images.length - 3}
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className={`
      relative bg-white dark:bg-[#171717] rounded-none md:rounded-2xl p-3 md:p-5 mb-0 md:mb-4 transition-all duration-200 border-x-0 border-t-0 md:border border-b border-[#efefef] dark:border-[#404040]
      ${post.isAnnouncement ? 'md:border-amber-200 dark:md:border-amber-700' : ''}
    `}>
      {post.isAnnouncement && (
        <div className="absolute -top-3 left-4 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm border border-amber-200 dark:border-amber-700">
          <AlertCircle size={12} />
          Оголошення
        </div>
      )}

      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <button onClick={() => onUserClick(post.author)} className="focus:outline-none flex-shrink-0">
            <img 
              src={post.author.avatar} 
              alt={post.author.name} 
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full object-cover ring-2 transition-transform active:scale-95 ${isDirector ? 'ring-amber-400 dark:ring-amber-500' : 'ring-[#efefef] dark:ring-[#404040]'}`}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <button 
                onClick={() => onUserClick(post.author)}
                className="font-semibold text-[#262626] dark:text-[#fafafa] text-xs md:text-sm hover:underline decoration-[#8e8e8e] dark:decoration-[#a3a3a3] underline-offset-2 truncate"
              >
                {post.author.name}
              </button>
              {post.author.grade && (
                <span className="text-[10px] text-[#8e8e8e] dark:text-[#a3a3a3]">• {post.author.grade}</span>
              )}
              {post.author.role !== UserRole.STUDENT && (
                <span className={`text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-md font-bold hidden sm:inline ${
                  isDirector || post.author.role === UserRole.SCHOOL_ADMIN ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' : 
                  post.author.role === UserRole.PARENT ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' :
                  'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                }`}>
                  {post.author.role}
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-[#8e8e8e] dark:text-[#a3a3a3] font-medium">{post.timestamp}</p>
          </div>
        </div>
        {canDelete && (
          <div className="relative flex-shrink-0 ml-1">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 md:p-2 rounded-full text-slate-400 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#262626] hover:text-slate-600 dark:hover:text-[#fafafa]"
            >
              <MoreVertical size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-[#262626] rounded-xl shadow-lg border border-slate-200 dark:border-[#404040] py-1 min-w-[160px]">
                  <button
                    onClick={() => { onDeletePost(post); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={16} /> Видалити пост
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mb-2 md:mb-4">
        <p className={`text-[14px] md:text-[15px] leading-relaxed whitespace-pre-line ${isDirector ? 'text-slate-900 dark:text-[#fafafa] font-medium' : 'text-slate-800 dark:text-[#e5e5e5]'}`}>
          {post.content}
        </p>
        {renderImages()}
      </div>

      <div className="flex items-center pt-2 md:pt-3 border-t border-[#efefef] dark:border-[#404040]">
        <div className="flex gap-3 md:gap-4">
          <button
            onClick={() => onLikeClick?.(post)}
            className={`flex items-center gap-1.5 md:gap-2 transition-colors group py-1 pr-1 -ml-1 rounded-lg hover:bg-[#f5f5f5] dark:hover:bg-[#262626] ${isLiked ? 'text-rose-500' : 'text-[#8e8e8e] dark:text-[#a3a3a3] hover:text-rose-500'}`}
          >
            <Heart size={18} className={`transition-all stroke-2 flex-shrink-0 md:w-5 md:h-5 ${isLiked ? 'fill-rose-500' : 'group-hover:fill-rose-500'}`} />
            <span className="text-xs md:text-sm font-semibold">{post.likes}</span>
          </button>
          <button 
            onClick={() => onCommentClick(post)}
            className="flex items-center gap-1.5 md:gap-2 text-[#8e8e8e] dark:text-[#a3a3a3] hover:text-[#0095f6] transition-colors py-1 pr-1 rounded-lg hover:bg-[#f5f5f5] dark:hover:bg-[#262626]"
          >
            <MessageSquare size={18} className="stroke-2 flex-shrink-0 md:w-5 md:h-5" />
            <span className="text-xs md:text-sm font-semibold">{post.commentsCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};