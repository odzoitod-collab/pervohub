import React, { useState, useRef, useEffect } from 'react';
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

  const imagesScrollRef = useRef<HTMLDivElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Sync carousel index when user scrolls (for 4+ images)
  useEffect(() => {
    const el = imagesScrollRef.current;
    if (!el || !post.images || post.images.length < 4) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setCarouselIndex(Math.min(idx, post.images!.length - 1));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [post.images?.length]);

  // Function to render images based on count
  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    if (post.images.length === 1) {
      return (
        <div className="mt-2 md:mt-3 rounded-xl overflow-hidden">
          <img 
            src={post.images[0]} 
            alt="Post content" 
            className="w-full h-auto object-cover max-h-[70vh] md:max-h-[400px] cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onImageClick(post.images![0])}
          />
        </div>
      );
    }

    // 2 або 3 фото — колаж однакового розміру
    if (post.images.length === 2 || post.images.length === 3) {
      const cols = post.images.length === 2 ? 2 : 3;
      return (
        <div className="mt-2 md:mt-3 grid gap-0.5 md:gap-1 rounded-xl overflow-hidden" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {post.images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              className="relative w-full aspect-square min-h-[140px] md:min-h-[160px] overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-inset"
              onClick={() => onImageClick(img)}
            >
              <img 
                src={img} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity"
              />
            </button>
          ))}
        </div>
      );
    }

    // 4+ фото — горизонтальний скрол як в Instagram, однаковий розмір слайдів
    return (
      <div className="mt-2 md:mt-3">
        <div
          ref={imagesScrollRef}
          className="overflow-x-auto snap-x snap-mandatory flex rounded-xl overflow-hidden no-scrollbar -mx-1"
          style={{ scrollBehavior: 'smooth' }}
        >
          {post.images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              className="flex-shrink-0 w-full min-w-full aspect-square max-h-[70vh] md:max-h-[420px] snap-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-inset"
              onClick={() => onImageClick(img)}
            >
              <img 
                src={img} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-1.5 mt-2">
          {post.images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Фото ${idx + 1}`}
              onClick={() => {
                imagesScrollRef.current?.scrollTo({ left: idx * (imagesScrollRef.current?.offsetWidth ?? 0), behavior: 'smooth' });
                setCarouselIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === carouselIndex ? 'bg-[#0095f6] scale-125' : 'bg-[#c4c4c4] dark:bg-[#525252] hover:bg-[#8e8e8e] dark:hover:bg-[#737373]'}`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`
      relative bg-white dark:bg-[#171717] rounded-2xl p-4 mb-3 md:mb-4 transition-all duration-200 shadow-sm
      ${post.isAnnouncement ? 'ring-1 ring-amber-200/50 dark:ring-amber-700/30' : ''}
    `}>
      {post.isAnnouncement && (
        <div className="absolute -top-3 left-4 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm border border-amber-200 dark:border-amber-700">
          <AlertCircle size={12} />
          Оголошення
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button type="button" onClick={() => onUserClick(post.author)} className="min-w-11 min-h-11 flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden focus:outline-none active:scale-95 transition-transform touch-manipulation">
            <img 
              src={post.author.avatar} 
              alt={post.author.name} 
              className={`w-10 h-10 rounded-full object-cover ring-2 ${isDirector ? 'ring-amber-400 dark:ring-amber-500' : 'ring-[#efefef] dark:ring-[#404040]'}`}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                type="button"
                onClick={() => onUserClick(post.author)}
                className="font-semibold text-[15px] text-[#262626] dark:text-[#fafafa] hover:underline decoration-[#8e8e8e] dark:decoration-[#a3a3a3] underline-offset-2 truncate text-left"
              >
                {post.author.name}
              </button>
              {post.author.grade && (
                <span className="text-xs text-[#8e8e8e] dark:text-[#a3a3a3]">• {post.author.grade}</span>
              )}
              {post.author.role !== UserRole.STUDENT && (
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold hidden sm:inline ${
                  isDirector || post.author.role === UserRole.SCHOOL_ADMIN ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' : 
                  post.author.role === UserRole.PARENT ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' :
                  'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                }`}>
                  {post.author.role}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8e8e8e] dark:text-[#a3a3a3] mt-0.5">{post.timestamp}</p>
          </div>
        </div>
        {canDelete && (
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-[#8e8e8e] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] hover:text-[#262626] dark:hover:text-[#fafafa] active:scale-95 transition-all touch-manipulation"
              aria-label="Ще"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-[#262626] rounded-xl shadow-xl py-1 min-w-[160px]">
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

      <div className="mb-3">
        <p className={`text-[14px] md:text-[15px] leading-relaxed whitespace-pre-line font-normal max-w-[70ch] ${isDirector ? 'text-[#262626] dark:text-[#fafafa] font-medium' : 'text-[#262626] dark:text-[#e5e5e5]'}`}>
          {post.content}
        </p>
        {renderImages()}
      </div>

      <div className="flex items-center pt-3 border-t border-gray-100 dark:border-[#262626]">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onLikeClick?.(post)}
            className={`min-h-11 min-w-11 flex items-center gap-2 transition-colors group px-2 -ml-2 rounded-xl hover:bg-[#f5f5f5] dark:hover:bg-[#262626] active:scale-95 touch-manipulation ${isLiked ? 'text-rose-500' : 'text-[#8e8e8e] dark:text-[#a3a3a3] hover:text-rose-500'}`}
          >
            <Heart size={20} className={`transition-all stroke-2 flex-shrink-0 ${isLiked ? 'fill-rose-500' : 'group-hover:fill-rose-500'}`} />
            <span className="text-sm font-semibold">{post.likes}</span>
          </button>
          <button 
            type="button"
            onClick={() => onCommentClick(post)}
            className="min-h-11 min-w-11 flex items-center gap-2 text-[#8e8e8e] dark:text-[#a3a3a3] hover:text-[#0095f6] transition-colors px-2 rounded-xl hover:bg-[#f5f5f5] dark:hover:bg-[#262626] active:scale-95 touch-manipulation"
          >
            <MessageSquare size={20} className="stroke-2 flex-shrink-0" />
            <span className="text-sm font-semibold">{post.commentsCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};