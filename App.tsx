import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Lightbulb, 
  PlusCircle, 
  ShieldCheck, 
  User as UserIcon, 
  Search, 
  School,
  X,
  AlertCircle,
  Tag,
  Target,
  Image as ImageIcon,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Settings,
  LogOut,
  Loader2,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Menu,
  Moon,
  Sun
} from 'lucide-react';
import { Tab, Post, Startup, UserRole, User, Comment, LostItem, LostStatus, StartupTeamRequest, isSchoolAdmin } from './types';
import { PostCard } from './components/PostCard';
import { StartupCard } from './components/StartupCard';
import { LostFoundCard } from './components/LostFoundCard';
import { TrustBox } from './components/TrustBox';
import { Button } from './components/Button';
import { PortfolioTab } from './components/PortfolioTab';
import { MoodTrackerModal } from './components/MoodTrackerModal';
import { JoinTeamModal } from './components/JoinTeamModal';
import { TeamRequestsModal } from './components/TeamRequestsModal';
import { ImageViewer } from './components/ImageViewer';
import { CommentModal } from './components/CommentModal';
import { AuthScreen } from './components/AuthScreen';
import { EditProfileModal } from './components/EditProfileModal';
import { SearchScreen } from './components/SearchScreen';
import { ServicesMenu } from './components/ServicesMenu';
import { ScheduleScreen } from './components/ScheduleScreen';
import { AdminPanel } from './components/AdminPanel';
import { NotificationsScreen } from './components/NotificationsScreen';
import { CountdownWidget } from './components/CountdownWidget';
import { SkeletonPost } from './components/SkeletonPost';
import { Toast, ToastType } from './components/Toast';
import { supabase } from './services/supabase';
import * as api from './services/api';
import { subscribeRealtime, RealtimeTables } from './services/realtime';

type CreateMode = 'post' | 'startup' | 'announcement' | 'lost_found';

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // --- Global Data State ---
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [posts, setPosts] = useState<Post[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [votedStartupIds, setVotedStartupIds] = useState<Set<string>>(new Set());
  const [dataLoading, setDataLoading] = useState(false);

  // --- View States ---
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [profileTab, setProfileTab] = useState<'feed' | 'portfolio'>('feed');
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [joinTeamStartup, setJoinTeamStartup] = useState<Startup | null>(null);
  const [teamRequestsStartup, setTeamRequestsStartup] = useState<Startup | null>(null);
  const [userTeamRequestsMap, setUserTeamRequestsMap] = useState<Map<string, StartupTeamRequest>>(new Map());
  const [authorPendingCounts, setAuthorPendingCounts] = useState<Record<string, number>>({});
  const [viewedImage, setViewedImage] = useState<string | null>(null);
  const [commentingPost, setCommentingPost] = useState<Post | null>(null);
  const commentingPostRef = useRef<Post | null>(null);
  commentingPostRef.current = commentingPost;
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showTrustBox, setShowTrustBox] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return localStorage.getItem('sidebarOpen') !== 'false'; } catch { return true; }
  });
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('sidebarOpen', String(sidebarOpen)); } catch {}
  }, [sidebarOpen]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark]);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('post');
  const [isPublishing, setIsPublishing] = useState(false);

  // --- Form Fields ---
  const [content, setContent] = useState('');
  
  // Image Handling: We need to store raw Files for upload, and strings for previews
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  
  // Startup specific fields
  const [startupTitle, setStartupTitle] = useState('');
  const [startupGoal, setStartupGoal] = useState('');
  const [startupTags, setStartupTags] = useState('');
  
  // Lost & Found specific fields
  const [lostStatus, setLostStatus] = useState<LostStatus>('lost');
  const [lostTitle, setLostTitle] = useState('');
  const [lostFilter, setLostFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    if (type !== 'loading') {
      setTimeout(() => setToast(null), 2800);
    }
  };

  useEffect(() => {
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
        setPosts([]);
        setStartups([]);
        setLostItems([]);
        setLikedPostIds(new Set());
        setVotedStartupIds(new Set());
        setCommentingPost(null);
        setViewedUser(null);
      } else {
        checkSession();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const hasLogged = await api.hasLoggedMoodToday(currentUser.id);
        if (!hasLogged) setShowMoodModal(true);
      } catch {
        setShowMoodModal(false);
      }
    })();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser || (activeTab !== Tab.STARTUPS && activeTab !== Tab.PROFILE)) return;
    (async () => {
      try {
        const map = await api.fetchUserTeamRequestsMap(currentUser.id);
        setUserTeamRequestsMap(map);
      } catch {
        setUserTeamRequestsMap(new Map());
      }
    })();
  }, [currentUser?.id, activeTab]);

  useEffect(() => {
    if (!currentUser || startups.length === 0) return;
    const myStartupIds = startups.filter((s) => s.author.id === currentUser.id).map((s) => s.id);
    if (myStartupIds.length === 0) return;
    (async () => {
      try {
        const counts: Record<string, number> = {};
        await Promise.all(
          myStartupIds.map(async (id) => {
            counts[id] = await api.fetchPendingTeamRequestsCount(id);
          })
        );
        setAuthorPendingCounts(counts);
      } catch {
        setAuthorPendingCounts({});
      }
    })();
  }, [currentUser?.id, startups]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeRealtime(handleRealtimeRefresh);
    return unsubscribe;
  }, [currentUser]);

  const checkSession = async () => {
    setSessionLoading(true);
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      console.error('Session check failed:', e);
      setCurrentUser(null);
    } finally {
      setSessionLoading(false);
    }
  };

  const loadData = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setDataLoading(true);
    try {
      if (activeTab === Tab.HOME || activeTab === Tab.PROFILE || activeTab === Tab.NOTIFICATIONS) {
        const [fetchedPosts, liked] = await Promise.all([
          api.fetchPosts(),
          api.fetchUserLikedPostIds(currentUser.id)
        ]);
        setPosts(fetchedPosts);
        setLikedPostIds(liked);
      }
      if (activeTab === Tab.STARTUPS || activeTab === Tab.PROFILE) {
        const [fetchedStartups, voted] = await Promise.all([
          api.fetchStartups(),
          api.fetchUserVotedStartupIds(currentUser.id)
        ]);
        setStartups(fetchedStartups);
        setVotedStartupIds(voted);
      }
      if (activeTab === Tab.LOST_FOUND) {
        const fetchedItems = await api.fetchLostItems();
        setLostItems(fetchedItems);
      }
    } catch (error) {
      if (!silent) showToast('error', 'Не вдалося завантажити дані');
    } finally {
      if (!silent) setDataLoading(false);
    }
  };

  const handleRealtimeRefresh = (table: RealtimeTables) => {
    if (!currentUser) return;
    const refreshPosts = async () => {
      const [fetchedPosts, liked] = await Promise.all([api.fetchPosts(), api.fetchUserLikedPostIds(currentUser!.id)]);
      setPosts(fetchedPosts);
      setLikedPostIds(liked);
      const openPost = commentingPostRef.current;
      if (openPost && (table === 'comments' || table === 'posts')) {
        const comments = await api.fetchComments(openPost.id);
        setCommentingPost(prev => prev && prev.id === openPost.id ? { ...prev, commentsData: comments, commentsCount: comments.length } : prev);
      }
    };
    const refreshStartups = async () => {
      const [fetchedStartups, voted] = await Promise.all([api.fetchStartups(), api.fetchUserVotedStartupIds(currentUser!.id)]);
      setStartups(fetchedStartups);
      setVotedStartupIds(voted);
    };
    const refreshLost = async () => {
      const items = await api.fetchLostItems();
      setLostItems(items);
    };
    if (table === 'posts' || table === 'likes' || table === 'comments') refreshPosts();
    else if (table === 'startups' || table === 'startup_votes') refreshStartups();
    else if (table === 'lost_items') refreshLost();
  };

  // --- Helpers ---
  const handleOpenModal = (mode?: CreateMode) => {
    setCreateMode(mode || 'post');
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setContent('');
    setStartupTitle('');
    setStartupGoal('');
    setStartupTags('');
    setLostTitle('');
    setLostStatus('lost');
    setSelectedFiles([]);
    setPreviewImages([]);
    setIsPublishing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[];
      const newPreviews = newFiles.map((file: File) => URL.createObjectURL(file));
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setPreviewImages(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!currentUser) return;
    setIsPublishing(true);
    showToast('loading', 'Публікація...');

    try {
      const uploadedImageUrls: string[] = [];
      for (const file of selectedFiles) {
        const url = await api.uploadImage(file);
        uploadedImageUrls.push(url);
      }

      if (createMode === 'startup') {
        if (!startupTitle.trim() || !startupGoal.trim()) {
          showToast('error', 'Заповніть назву та ціль');
          setIsPublishing(false);
          return;
        }
        await api.createStartup(currentUser.id, {
          title: startupTitle,
          description: content,
          goal: parseInt(startupGoal),
          tags: startupTags.split(',').map(t => t.trim()).filter(Boolean)
        });
        await loadData();
        setActiveTab(Tab.STARTUPS);
        showToast('success', 'Стартап опубліковано');
      } else if (createMode === 'lost_found') {
        if (!lostTitle.trim()) {
          showToast('error', "Вкажіть назву речі");
          setIsPublishing(false);
          return;
        }
        if (uploadedImageUrls.length === 0) {
          showToast('error', "Додайте фото для бюро знахідок");
          setIsPublishing(false);
          return;
        }
        await api.createLostItem(currentUser.id, {
          title: lostTitle,
          description: content || (lostStatus === 'lost' ? 'Загублено' : 'Знайдено'),
          status: lostStatus,
          image: uploadedImageUrls[0],
          contactInfo: lostStatus === 'found' ? 'Див. опис' : undefined
        });
        await loadData();
        setActiveTab(Tab.LOST_FOUND);
        showToast('success', 'Оголошення додано');
      } else {
        if (!content.trim()) {
          showToast('error', 'Введіть текст поста');
          setIsPublishing(false);
          return;
        }
        const isAnnouncement = createMode === 'announcement';
        await api.createPost(currentUser.id, content.trim(), uploadedImageUrls, isAnnouncement);
        await loadData();
        setActiveTab(Tab.HOME);
        showToast('success', isAnnouncement ? 'Оголошення опубліковано' : 'Пост опубліковано');
      }

      handleCloseModal();
    } catch (error) {
      console.error("Publishing error:", error);
      showToast('error', 'Помилка при публікації. Спробуйте ще раз.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLikeClick = async (post: Post) => {
    if (!currentUser) return;
    try {
      const { likes } = await api.toggleLike(post.id, currentUser.id);
      const wasLiked = likedPostIds.has(post.id);
      setLikedPostIds(prev => {
        const next = new Set(prev);
        if (wasLiked) next.delete(post.id);
        else next.add(post.id);
        return next;
      });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes } : p));
      setCommentingPost(prev => prev && prev.id === post.id ? { ...prev, likes } : prev);
    } catch (e) {
      console.error("Like error", e);
      showToast('error', 'Не вдалося поставити лайк');
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!currentUser) return;
    try {
        const newComment = await api.addComment(currentUser.id, postId, text);
        
        // Update local state to reflect comment immediately
        const updatePosts = (prev: Post[]) => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    commentsCount: p.commentsCount + 1,
                    commentsData: [...(p.commentsData || []), newComment]
                };
            }
            return p;
        });

        setPosts(updatePosts);
        
        // Also update the modal view post
        setCommentingPost(prev => {
            if (prev && prev.id === postId) {
                return {
                    ...prev,
                    commentsCount: prev.commentsCount + 1,
                    commentsData: [...(prev.commentsData || []), newComment]
                };
            }
            return prev;
        });

    } catch (error) {
        console.error("Error adding comment:", error);
        showToast('error', 'Не вдалося додати коментар');
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!currentUser) return;
    if (!confirm('Видалити цей пост?')) return;
    try {
      await api.deletePost(post.id, currentUser.id, currentUser.role);
      setPosts(prev => prev.filter(p => p.id !== post.id));
      if (commentingPost?.id === post.id) setCommentingPost(null);
      showToast('success', 'Пост видалено');
    } catch (e) {
      console.error(e);
      showToast('error', 'Не вдалося видалити пост');
    }
  };

  const handleVoteStartup = async (startup: { id: string }) => {
    if (!currentUser) return;
    try {
      const { currentSupport } = await api.voteStartup(startup.id, currentUser.id);
      setStartups(prev => prev.map(s => s.id === startup.id ? { ...s, currentSupport } : s));
      setVotedStartupIds(prev => {
        const next = new Set(prev);
        if (next.has(startup.id)) next.delete(startup.id);
        else next.add(startup.id);
        return next;
      });
    } catch (e) {
      console.error(e);
      showToast('error', 'Не вдалося проголосувати');
    }
  };

  const handleAcceptStartup = async (startup: { id: string }) => {
    if (!currentUser) return;
    try {
      await api.updateStartupStatus(startup.id, 'accepted', currentUser.role);
      setStartups(prev => prev.map(s => s.id === startup.id ? { ...s, status: 'accepted' } : s));
      showToast('success', 'Стартап прийнято');
    } catch (e) {
      console.error(e);
      showToast('error', 'Не вдалося прийняти');
    }
  };

  const handleRejectStartup = async (startup: { id: string }) => {
    if (!currentUser || !confirm('Відхилити цей стартап? Він зникне з переліку.')) return;
    try {
      await api.updateStartupStatus(startup.id, 'rejected', currentUser.role);
      setStartups(prev => prev.filter(s => s.id !== startup.id));
      showToast('success', 'Стартап відхилено');
    } catch (e) {
      console.error(e);
      showToast('error', 'Не вдалося відхилити');
    }
  };

  const handleMarkFoundLostItem = async (item: { id: string }) => {
    if (!currentUser) return;
    try {
      await api.updateLostItemStatus(item.id, 'found', currentUser.id, currentUser.role);
      setLostItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'found' as const } : i));
      showToast('success', 'Позначено як знайдено');
    } catch (e) {
      console.error(e);
      showToast('error', 'Не вдалося оновити');
    }
  };

  const handleDeleteLostItem = async (item: { id: string }) => {
    if (!currentUser || !confirm('Видалити це оголошення?')) return;
    try {
      await api.deleteLostItem(item.id, currentUser.id, currentUser.role);
      setLostItems(prev => prev.filter(i => i.id !== item.id));
      showToast('success', 'Оголошення видалено');
    } catch (e) {
      console.error(e);
      showToast('error', 'Не вдалося видалити');
    }
  };

  const handleDeleteStartup = async (startup: { id: string }) => {
    if (!currentUser || !confirm('Видалити цей стартап назавжди?')) return;
    try {
      await api.deleteStartup(startup.id, currentUser.role);
      setStartups(prev => prev.filter(s => s.id !== startup.id));
      showToast('success', 'Стартап видалено');
    } catch (e) {
      console.error(e);
      showToast('error', 'Не вдалося видалити');
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!currentUser) return;
    try {
      await api.deleteComment(commentId, currentUser.id, currentUser.role);
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const newComments = (p.commentsData || []).filter(c => c.id !== commentId);
        return { ...p, commentsCount: newComments.length, commentsData: newComments };
      }));
      setCommentingPost(prev => prev && prev.id === postId ? {
        ...prev,
        commentsCount: (prev.commentsData?.length ?? 1) - 1,
        commentsData: (prev.commentsData || []).filter(c => c.id !== commentId)
      } : prev);
    } catch (e) {
      console.error(e);
      showToast('error', 'Не вдалося видалити коментар');
    }
  };

  const openCommentModal = async (post: Post) => {
    setCommentingPost({ ...post, commentsData: [] });
    try {
      const comments = await api.fetchComments(post.id);
      setCommentingPost(prev => prev ? ({ ...prev, commentsData: comments }) : null);
    } catch (e) {
      console.error(e);
      showToast('error', 'Не вдалося завантажити коментарі');
    }
  };

  const handleSaveProfile = async (updatedUser: User) => {
    if (!currentUser) return;
    showToast('loading', 'Збереження...');
    try {
        let finalAvatar = updatedUser.avatar;
        
        // Check if avatar is a blob url (newly uploaded) - logic handled in EditProfileModal now
        // But if EditProfileModal returns the final URL, we just save to DB
        // NOTE: EditProfileModal handles the upload now, so updatedUser has the real URL
        
        const savedUser = await api.updateUserProfile(currentUser.id, updatedUser);
        setCurrentUser(savedUser);
        showToast('success', 'Профіль оновлено');
    } catch (e) {
        console.error("Profile update failed", e);
        showToast('error', "Не вдалося оновити профіль");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveTab(Tab.HOME);
    setPosts([]);
    setStartups([]);
    setLostItems([]);
    setLikedPostIds(new Set());
    setVotedStartupIds(new Set());
    setViewedUser(null);
    setCommentingPost(null);
  };

  // --- Interaction Handlers ---
  const handleUserClick = (user: User) => {
    setViewedUser(user);
    setProfileTab('feed');
    setCommentingPost(null);
    window.scrollTo(0, 0);
  };

  const goBackToMenu = () => {
    setActiveTab(Tab.SERVICES);
    setViewedUser(null);
    setShowTrustBox(false);
  };

  const showBackToMenu = showTrustBox || activeTab === Tab.PROFILE || activeTab === Tab.SCHEDULE || activeTab === Tab.LOST_FOUND || activeTab === Tab.ADMIN;

  // --- Navigation Components ---
  const CreateNavItem = ({ onClick, icon: Icon, label }: { onClick: () => void; icon: React.ElementType; label: string }) => (
    <button 
      onClick={onClick}
      className="flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all text-[#8e8e8e] dark:text-[#a3a3a3] hover:text-[#262626] dark:hover:text-[#fafafa] md:hover:bg-[#f5f5f5] dark:md:hover:bg-[#262626]"
    >
      <Icon size={22} strokeWidth={2} />
      <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0">{label}</span>
    </button>
  );

  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab; icon: React.ElementType; label: string }) => {
    const isActive = activeTab === tab && !viewedUser;
    return (
      <button 
        onClick={() => { setActiveTab(tab); setViewedUser(null); }}
        className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${
          isActive 
            ? 'text-[#0095f6] md:bg-[#efefef] dark:md:bg-[#262626]' 
            : 'text-[#8e8e8e] dark:text-[#a3a3a3] hover:text-[#262626] dark:hover:text-[#fafafa] md:hover:bg-[#f5f5f5] dark:md:hover:bg-[#262626]'
        }`}
      >
        <Icon size={isActive ? 24 : 22} className={isActive ? "fill-current md:fill-none" : ""} strokeWidth={isActive ? 2.5 : 2} />
        <span className={`text-[10px] md:text-sm font-medium mt-1 md:mt-0 ${isActive ? 'md:font-bold' : ''}`}>
          {label}
        </span>
      </button>
    );
  };

  // --- Main Content Renderer ---
  const renderContent = () => {
    if (dataLoading && !viewedUser && activeTab !== Tab.CREATE && activeTab !== Tab.SEARCH && activeTab !== Tab.NOTIFICATIONS && activeTab !== Tab.SERVICES && activeTab !== Tab.SCHEDULE && activeTab !== Tab.ADMIN) {
        if (activeTab === Tab.HOME || activeTab === Tab.PROFILE) {
          return (
            <div className="-mx-4 md:mx-0 space-y-0 md:space-y-4 pb-24 md:pb-0">
              {[1, 2, 3].map((i) => <SkeletonPost key={i} />)}
            </div>
          );
        }
        return (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#0095f6]" size={32} />
          </div>
        );
    }

    if (viewedUser || activeTab === Tab.PROFILE) {
      if (!currentUser) return null; 

      const userToDisplay = viewedUser || currentUser;
      const userPosts = posts.filter(p => p.author.id === userToDisplay.id);
      const userStartups = startups.filter(s => s.author.id === userToDisplay.id);
      const isOwnProfile = userToDisplay.id === currentUser.id;

      if (isOwnProfile && !viewedUser && showTrustBox) {
        return (
          <div className="pb-24 md:pb-0 animate-fade-in">
            <TrustBox 
              currentUser={currentUser}
              onSuccess={(msg) => showToast('success', msg)} 
              onError={(msg) => showToast('error', msg)} 
            />
          </div>
        );
      }

      return (
        <div className="pb-24 md:pb-0 animate-fade-in">
          <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 border border-[#efefef] dark:border-[#404040] text-center mb-6">
            <div className="relative inline-block mb-4">
              <img src={userToDisplay.avatar} alt="Profile" className="w-24 h-24 rounded-full mx-auto border-4 border-slate-50 dark:border-[#262626] object-cover" />
              <div className="absolute bottom-0 right-0 bg-[#0095f6] text-white rounded-full p-1.5 border-2 border-white dark:border-[#171717]">
                <School size={14} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#262626] dark:text-[#fafafa]">{userToDisplay.name}</h2>
            <p className="text-[#8e8e8e] dark:text-[#a3a3a3] mb-2 font-medium">{userToDisplay.role} • {userToDisplay.grade}</p>
            {userToDisplay.bio && <p className="text-sm text-slate-600 dark:text-[#a3a3a3] mb-4 max-w-sm mx-auto">{userToDisplay.bio}</p>}
            
            <div className="flex justify-center gap-8 mb-6 border-t border-b border-slate-50 dark:border-[#404040] py-4">
               <div className="text-center">
                 <div className="text-xl font-bold text-[#262626] dark:text-[#fafafa]">{userPosts.length}</div>
                 <div className="text-xs font-medium text-[#8e8e8e] dark:text-[#a3a3a3] uppercase tracking-wide">Постів</div>
               </div>
               <div className="text-center">
                 <div className="text-xl font-bold text-[#262626] dark:text-[#fafafa]">{userStartups.length}</div>
                 <div className="text-xs font-medium text-[#8e8e8e] dark:text-[#a3a3a3] uppercase tracking-wide">Стартапів</div>
               </div>
            </div>
            
            {isOwnProfile && !viewedUser && (
                <>
                <button 
                  onClick={() => setShowTrustBox(true)}
                  className="w-full mb-4 py-4 px-6 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-2xl flex items-center justify-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  <ShieldCheck size={24} />
                  Скарбничка довіри
                </button>
                <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-[#a3a3a3] hover:text-indigo-600 dark:hover:text-indigo-400 py-3 px-4 hover:bg-slate-100 dark:hover:bg-[#262626] rounded-xl transition-colors font-medium"
                    >
                      <Settings size={16} /> Редагувати профіль
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex-1 flex items-center justify-center gap-2 text-sm text-rose-600 hover:text-rose-700 py-3 px-4 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors font-medium"
                    >
                      <LogOut size={16} /> Вийти
                    </button>
                </div>
                </>
            )}
          </div>

          <div className="flex gap-2 mb-4 border-b border-[#efefef] dark:border-[#404040]">
            <button
              onClick={() => setProfileTab('feed')}
              className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
                profileTab === 'feed'
                  ? 'border-[#0095f6] text-[#0095f6]'
                  : 'border-transparent text-[#8e8e8e] dark:text-[#a3a3a3] hover:text-[#262626] dark:hover:text-[#fafafa]'
              }`}
            >
              Стрічка
            </button>
            <button
              onClick={() => setProfileTab('portfolio')}
              className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
                profileTab === 'portfolio'
                  ? 'border-[#0095f6] text-[#0095f6]'
                  : 'border-transparent text-[#8e8e8e] dark:text-[#a3a3a3] hover:text-[#262626] dark:hover:text-[#fafafa]'
              }`}
            >
              Портфоліо
            </button>
          </div>

          {profileTab === 'portfolio' ? (
            <PortfolioTab
              user={userToDisplay}
              isOwnProfile={isOwnProfile}
              onToast={showToast}
            />
          ) : (
          <>
          <h3 className="font-bold text-slate-900 dark:text-[#fafafa] mb-3 px-1 text-lg">Публікації</h3>
          <div className="space-y-4">
             {userPosts.length > 0 ? (
                 userPosts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        isLiked={likedPostIds.has(post.id)}
                        currentUser={currentUser}
                        onUserClick={handleUserClick} 
                        onCommentClick={openCommentModal}
                        onImageClick={setViewedImage}
                        onLikeClick={handleLikeClick}
                        onDeletePost={handleDeletePost}
                    />
                 ))
             ) : (
                 <div className="text-center py-10 text-slate-400 dark:text-[#a3a3a3] bg-white dark:bg-[#171717] rounded-2xl border border-slate-100 dark:border-[#404040] border-dashed">
                     <p>Немає публікацій</p>
                 </div>
             )}
          </div>
          </>
          )}
        </div>
      );
    }

    if (activeTab === Tab.SEARCH) {
      return <SearchScreen onUserClick={handleUserClick} />;
    }

    if (activeTab === Tab.SERVICES) {
      const handleServicesNav = (target: 'profile' | 'lost_found' | 'trust_box' | 'schedule' | 'admin') => {
        if (target === 'profile') { setActiveTab(Tab.PROFILE); setViewedUser(null); setShowTrustBox(false); }
        else if (target === 'lost_found') { setActiveTab(Tab.LOST_FOUND); setViewedUser(null); }
        else if (target === 'trust_box') { setActiveTab(Tab.PROFILE); setViewedUser(null); setShowTrustBox(true); }
        else if (target === 'schedule') { setActiveTab(Tab.SCHEDULE); setViewedUser(null); }
        else if (target === 'admin') { setActiveTab(Tab.ADMIN); setViewedUser(null); }
      };
      return <ServicesMenu onNavigate={handleServicesNav} isAdmin={currentUser ? isSchoolAdmin(currentUser.role) : false} />;
    }

    if (activeTab === Tab.SCHEDULE) {
      return currentUser ? <ScheduleScreen currentUser={currentUser} onToast={showToast} /> : null;
    }

    if (activeTab === Tab.ADMIN) {
      return currentUser ? <AdminPanel currentUser={currentUser} onToast={showToast} /> : null;
    }

    if (activeTab === Tab.NOTIFICATIONS) {
      return currentUser ? (
        <NotificationsScreen
          currentUser={currentUser}
          posts={posts}
          onCommentClick={openCommentModal}
          onUserClick={handleUserClick}
        />
      ) : null;
    }

    switch (activeTab) {
      case Tab.HOME:
        return (
          <div className="-mx-2 sm:-mx-4 md:mx-0 space-y-0 md:space-y-4 lg:space-y-5 pb-24 md:pb-0">
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-6xl mb-4">📝</span>
                  <h3 className="text-lg font-bold text-[#262626] dark:text-[#fafafa] mb-2">Ще немає постів</h3>
                  <p className="text-[#737373] dark:text-[#a3a3a3] text-sm mb-4 max-w-xs">Будь першим — поділись новиною зі школою!</p>
                  <Button onClick={handleOpenModal} className="gap-2">+ Створити пост</Button>
                </div>
            ) : (
                posts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        isLiked={likedPostIds.has(post.id)}
                        currentUser={currentUser}
                        onUserClick={handleUserClick} 
                        onCommentClick={openCommentModal}
                        onImageClick={setViewedImage}
                        onLikeClick={handleLikeClick}
                        onDeletePost={handleDeletePost}
                    />
                ))
            )}
          </div>
        );
      case Tab.STARTUPS:
        return (
          <div className="space-y-4 lg:space-y-5 pb-24 md:pb-0">
             <div className="bg-gradient-to-br from-[#0095f6] to-[#00376b] rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
               <div className="relative z-10">
                 <h2 className="text-xl font-bold mb-2">Є ідея?</h2>
                 <p className="text-indigo-100 text-sm mb-4 max-w-sm font-medium">
                   Опиши свій стартап, збери лайки від учнів, і школа допоможе реалізувати проєкт!
                 </p>
                 <Button 
                   variant="secondary"
                   onClick={handleOpenModal} 
                   className="!bg-white !text-[#0095f6] hover:!bg-white/90 !border-none font-semibold py-3 px-6"
                 >
                   Додати Стартап
                 </Button>
               </div>
               <div className="absolute right-[-20px] top-[-20px] opacity-20">
                 <Lightbulb size={150} />
               </div>
             </div>
             {startups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-[#171717] rounded-2xl border border-[#efefef] dark:border-[#262626]">
                <span className="text-6xl mb-4">💡</span>
                <h3 className="text-lg font-bold text-[#262626] dark:text-[#fafafa] mb-2">Ще немає ідей</h3>
                <p className="text-[#737373] dark:text-[#a3a3a3] text-sm mb-4 max-w-xs">Опиши свою ідею — школа допоможе її реалізувати!</p>
                <Button onClick={handleOpenModal} variant="secondary" className="gap-2">+ Додати стартап</Button>
              </div>
             ) : (
              startups.map(startup => (
              <StartupCard
                key={startup.id}
                startup={startup}
                currentUser={currentUser}
                isVoted={votedStartupIds.has(startup.id)}
                myTeamRequest={userTeamRequestsMap.get(startup.id) ?? null}
                pendingRequestsCount={authorPendingCounts[startup.id] ?? 0}
                onVote={handleVoteStartup}
                onAccept={handleAcceptStartup}
                onReject={handleRejectStartup}
                onDelete={handleDeleteStartup}
                onJoinTeam={(s) => setJoinTeamStartup(s)}
                onOpenTeamRequests={(s) => setTeamRequestsStartup(s)}
              />
            ))
            )}
          </div>
        );
      case Tab.LOST_FOUND:
        const lostCount = lostItems.filter(i => i.status === 'lost').length;
        const foundCount = lostItems.filter(i => i.status === 'found').length;
        const filteredLostItems = lostFilter === 'all' ? lostItems : lostItems.filter(i => i.status === lostFilter);
        return (
          <div className="space-y-4 lg:space-y-5 pb-24 md:pb-0">
             <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-5 border border-rose-100 dark:border-rose-800 mb-4">
               <div className="flex items-center justify-between flex-wrap gap-3">
                 <div>
                   <h2 className="text-xl font-bold text-slate-900 dark:text-[#fafafa]">Бюро знахідок</h2>
                   <p className="text-sm text-slate-600 dark:text-[#a3a3a3] mt-0.5">Загубили або знайшли? Додай оголошення</p>
                 </div>
                 <Button onClick={() => handleOpenModal('lost_found')} className="gap-2 bg-rose-600 hover:bg-rose-700 border-rose-500 shadow-rose-200">
                   <PlusCircle size={18} />
                   Додати оголошення
                 </Button>
               </div>
               <div className="flex flex-wrap gap-2 mt-3">
                 {(['all', 'lost', 'found'] as const).map(f => (
                   <button
                     key={f}
                     onClick={() => setLostFilter(f)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                       lostFilter === f
                         ? f === 'lost' ? 'bg-rose-600 text-white' : f === 'found' ? 'bg-emerald-600 text-white' : 'bg-slate-700 dark:bg-slate-600 text-white'
                         : 'bg-white/60 dark:bg-[#171717]/60 text-slate-600 dark:text-[#a3a3a3] hover:bg-white dark:hover:bg-[#262626]'
                     }`}
                   >
                     {f === 'all' ? 'Всі' : f === 'lost' ? `Шукають (${lostCount})` : `Знайдено (${foundCount})`}
                   </button>
                 ))}
               </div>
             </div>
             {lostItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-[#171717] rounded-2xl border border-[#efefef] dark:border-[#262626] border-dashed">
                    <span className="text-6xl mb-4">🔍</span>
                    <p className="font-bold text-[#262626] dark:text-[#fafafa] mb-2">Поки що немає оголошень</p>
                    <p className="text-[#737373] dark:text-[#a3a3a3] text-sm mb-4">Будь першим — додай загублену чи знайдену річ</p>
                    <Button onClick={() => handleOpenModal('lost_found')} variant="secondary" className="gap-2">
                      <PlusCircle size={16} /> Додати оголошення
                    </Button>
                </div>
             ) : filteredLostItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-[#171717] rounded-2xl border border-[#efefef] dark:border-[#262626] border-dashed">
                  <span className="text-4xl mb-2">📭</span>
                  <p className="text-[#737373] dark:text-[#a3a3a3]">Немає оголошень у цій категорії</p>
                </div>
             ) : (
                filteredLostItems.map(item => (
                   <LostFoundCard
                     key={item.id}
                     item={item}
                     currentUser={currentUser}
                     onImageClick={setViewedImage}
                     onMarkFound={handleMarkFoundLostItem}
                     onDelete={handleDeleteLostItem}
                   />
                ))
             )}
          </div>
        );
      default:
        return null;
    }
  };

  if (sessionLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
          <Loader2 className="animate-spin text-[#0095f6]" size={48} />
      </div>;
  }

  // --- RENDER AUTH SCREEN IF NOT LOGGED IN ---
  if (!currentUser) {
    return <AuthScreen onLogin={checkSession} />;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-[#262626] dark:text-[#fafafa] transition-colors">
      
      {/* --- DESKTOP LAYOUT --- */}
      <div className="w-full min-h-screen flex">
        
        {/* Left Sidebar (Desktop) */}
        <aside 
          className={`hidden lg:flex flex-col w-52 fixed left-0 top-0 h-screen p-4 border-r border-[#efefef] dark:border-[#404040] bg-white dark:bg-[#0a0a0a] z-20 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between mb-6 px-1">
             {viewedUser ? (
               <button 
                 onClick={() => setViewedUser(null)}
                 className="flex items-center gap-2 text-[#262626] dark:text-[#fafafa] font-medium hover:opacity-80 py-1"
               >
                 <ArrowLeft size={18} />
                 <span>Назад</span>
               </button>
             ) : showBackToMenu ? (
               <button 
                 onClick={goBackToMenu}
                 className="flex items-center gap-2 text-[#262626] dark:text-[#fafafa] font-medium hover:opacity-80 py-1"
               >
                 <ArrowLeft size={18} />
                 <span>Назад</span>
               </button>
             ) : (
               <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => {setActiveTab(Tab.HOME); setViewedUser(null);}}>
                 <div className="bg-gradient-to-br from-[#0095f6] to-[#00376b] p-1.5 rounded-lg text-white shadow-sm flex-shrink-0">
                   <School size={20} />
                 </div>
                 <h1 className="text-xl font-bold tracking-tight text-[#262626] dark:text-[#fafafa] truncate">Pervoz<span className="text-[#0095f6]">Hub</span></h1>
               </div>
             )}
             <div className="flex items-center gap-1 flex-shrink-0">
               <button 
                 onClick={() => setIsDark(!isDark)}
                 className="p-1.5 rounded-lg text-[#737373] dark:text-[#a3a3a3] hover:bg-[#efefef] dark:hover:bg-[#262626]"
                 aria-label={isDark ? 'Світла тема' : 'Темна тема'}
               >
                 {isDark ? <Sun size={18} /> : <Moon size={18} />}
               </button>
               <button 
                 onClick={() => { setActiveTab(Tab.SEARCH); setViewedUser(null); }}
                 className="p-1.5 rounded-lg text-[#737373] dark:text-[#a3a3a3] hover:bg-[#efefef] dark:hover:bg-[#262626]"
                 aria-label="Пошук"
               >
                 <Search size={18} />
               </button>
               <button 
                 onClick={() => setSidebarOpen(false)}
                 className="p-1.5 rounded-lg text-[#737373] dark:text-[#a3a3a3] hover:bg-[#efefef] dark:hover:bg-[#262626]"
                 aria-label="Сховати меню"
               >
                 <PanelLeftClose size={18} />
               </button>
             </div>
          </div>
          
          <nav className="space-y-1 flex-1">
            <NavItem tab={Tab.HOME} icon={Home} label="Головна" />
            <NavItem tab={Tab.STARTUPS} icon={Lightbulb} label="Стартапи" />
            <CreateNavItem onClick={handleOpenModal} icon={PlusCircle} label="Створити" />
            <NavItem tab={Tab.NOTIFICATIONS} icon={Bell} label="Сповіщення" />
            <NavItem tab={Tab.SERVICES} icon={Menu} label="Меню" />
          </nav>
        </aside>

        {/* Toggle sidebar when collapsed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hidden lg:flex fixed left-0 top-20 z-30 p-2.5 rounded-r-xl bg-white dark:bg-[#171717]/95 backdrop-blur border border-l-0 border-[#efefef] dark:border-[#404040] shadow-md text-[#8e8e8e] dark:text-[#a3a3a3] hover:bg-white dark:hover:bg-[#262626] hover:text-[#262626] dark:hover:text-[#fafafa] transition-all"
            aria-label="Показати меню"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}

        {/* Center Feed */}
        <main className={`w-full max-w-[600px] min-w-0 pt-4 px-2 sm:px-4 lg:px-6 transition-[margin] duration-300 ${sidebarOpen ? 'lg:ml-52' : 'lg:ml-4'} xl:mr-80`}>
          {/* Mobile Header */}
          <header className="lg:hidden flex justify-between items-center py-3 px-4 mb-1 sticky top-0 z-20 bg-[#fafafa]/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#efefef] dark:border-[#404040]">
             {viewedUser ? (
               <button 
                 onClick={() => setViewedUser(null)}
                 className="flex items-center gap-2 text-[#262626] dark:text-[#fafafa] font-medium hover:opacity-80"
               >
                 <ArrowLeft size={20} />
                 Назад
               </button>
             ) : showBackToMenu ? (
               <button 
                 onClick={goBackToMenu}
                 className="flex items-center gap-2 text-[#262626] dark:text-[#fafafa] font-medium hover:opacity-80"
               >
                 <ArrowLeft size={20} />
                 Назад
               </button>
             ) : (
               <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setActiveTab(Tab.HOME); setViewedUser(null);}}>
                 <div className="bg-gradient-to-br from-[#0095f6] to-[#00376b] p-1.5 rounded-lg text-white shadow-sm">
                   <School size={18} />
                 </div>
                 <h1 className="text-xl font-bold text-[#262626] dark:text-[#fafafa]">Pervoz<span className="text-[#0095f6]">Hub</span></h1>
               </div>
             )}
             <div className="flex items-center gap-1">
               <button
                 onClick={() => setIsDark(!isDark)}
                 className="p-2 rounded-full text-[#262626] dark:text-[#fafafa] hover:bg-[#efefef] dark:hover:bg-[#262626]"
                 aria-label={isDark ? 'Світла тема' : 'Темна тема'}
               >
                 {isDark ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <button 
                 onClick={() => { setActiveTab(Tab.SEARCH); setViewedUser(null); }}
                 className="p-2 -mr-2 rounded-full text-[#262626] dark:text-[#fafafa] hover:bg-[#efefef] dark:hover:bg-[#262626]"
                 aria-label="Пошук"
               >
                 <Search size={22} />
               </button>
             </div>
          </header>

          {renderContent()}
        </main>

        {/* Right Sidebar (Desktop) */}
        <aside className="hidden xl:block w-80 fixed right-0 top-0 h-screen p-6 overflow-y-auto no-scrollbar border-l border-[#efefef] dark:border-[#404040] bg-white dark:bg-[#0a0a0a] z-20">
          <div className="sticky top-0 bg-white dark:bg-[#0a0a0a] pt-2 pb-4 z-10">
            <button
              onClick={() => { setActiveTab(Tab.SEARCH); setViewedUser(null); }}
              className="w-full flex items-center gap-3 bg-slate-100 dark:bg-[#262626] border-0 rounded-xl py-2.5 px-4 text-sm text-slate-500 dark:text-[#a3a3a3] hover:bg-slate-200 dark:hover:bg-[#404040] transition-colors text-left"
            >
              <Search className="text-slate-400 dark:text-[#a3a3a3] flex-shrink-0" size={18} />
              <span>Пошук людей...</span>
            </button>
          </div>

            <CountdownWidget />
            <div className="bg-[#fafafa] dark:bg-[#171717] rounded-2xl p-4 border border-[#efefef] dark:border-[#404040] mb-6 mt-6">
            <h3 className="font-semibold text-[#262626] dark:text-[#fafafa] mb-4 text-sm uppercase tracking-wide">Топ ідей</h3>
            <div className="space-y-4">
              {[...startups].sort((a, b) => b.currentSupport - a.currentSupport).slice(0, 3).map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-[#262626] p-2 -mx-2 rounded-lg transition-colors" onClick={() => setActiveTab(Tab.STARTUPS)}>
                  <div className="font-black text-indigo-600 dark:text-indigo-400 text-lg w-4">{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-[#fafafa] truncate">{s.title}</p>
                    <p className="text-xs text-slate-500 dark:text-[#a3a3a3] font-medium">{s.currentSupport} голосів</p>
                  </div>
                </div>
              ))}
              {startups.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-[#a3a3a3] py-2">Поки немає ідей</p>
              )}
            </div>
          </div>

            {posts.some(p => p.isAnnouncement) && (
            <div className="bg-amber-50/80 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200/60 dark:border-amber-700/50">
              <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                <AlertCircle size={16} /> Оголошення
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed font-medium line-clamp-2">
                {posts.find(p => p.isAnnouncement)?.content}
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="lg:hidden mobile-nav-fixed fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-[#efefef] dark:border-[#404040] px-2 py-2 flex justify-around items-center z-[100] safe-area-pb">
        <NavItem tab={Tab.HOME} icon={Home} label="Головна" />
        <NavItem tab={Tab.STARTUPS} icon={Lightbulb} label="Ідеї" />
        <CreateNavItem onClick={handleOpenModal} icon={PlusCircle} label="Створити" />
        <NavItem tab={Tab.NOTIFICATIONS} icon={Bell} label="Сповіщення" />
        <NavItem tab={Tab.SERVICES} icon={Menu} label="Меню" />
      </nav>

      {/* --- CREATE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="relative bg-white dark:bg-[#171717] w-full md:max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl p-6 animate-slide-up md:animate-scale-in flex flex-col max-h-[90vh] border border-[#efefef] dark:border-[#404040]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-[#fafafa]">Створити</h2>
              <button onClick={handleCloseModal} className="p-2 bg-slate-100 dark:bg-[#262626] rounded-full text-slate-500 dark:text-[#a3a3a3] hover:bg-slate-200 dark:hover:bg-[#404040]">
                <X size={20} />
              </button>
            </div>
            
            {/* Mode Switcher */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar flex-shrink-0">
              <button 
                onClick={() => setCreateMode('post')}
                className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${createMode === 'post' ? 'bg-[#0095f6] text-white' : 'bg-[#efefef] dark:bg-[#262626] text-[#8e8e8e] dark:text-[#a3a3a3] hover:bg-[#e0e0e0] dark:hover:bg-[#404040]'}`}
              >
                Пост
              </button>
              <button 
                onClick={() => setCreateMode('startup')}
                className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${createMode === 'startup' ? 'bg-[#0095f6] text-white' : 'bg-[#efefef] dark:bg-[#262626] text-[#8e8e8e] dark:text-[#a3a3a3] hover:bg-[#e0e0e0] dark:hover:bg-[#404040]'}`}
              >
                Стартап
              </button>
              <button 
                onClick={() => setCreateMode('lost_found')}
                className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${createMode === 'lost_found' ? 'bg-rose-500 text-white' : 'bg-[#efefef] dark:bg-[#262626] text-[#8e8e8e] dark:text-[#a3a3a3] hover:bg-[#e0e0e0] dark:hover:bg-[#404040]'}`}
              >
                 Бюро знахідок
              </button>
              <button 
                onClick={() => setCreateMode('announcement')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${createMode === 'announcement' ? 'bg-amber-500 text-white' : 'bg-[#efefef] dark:bg-[#262626] text-[#8e8e8e] dark:text-[#a3a3a3] hover:bg-[#e0e0e0] dark:hover:bg-[#404040]'}`}
              >
                 <AlertCircle size={14} /> Оголошення
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              
              {/* STARTUP SPECIFIC FIELDS */}
              {createMode === 'startup' && (
                <div className="space-y-3 mb-3 animate-slide-up">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Назва стартапу</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-900 placeholder-slate-400"
                      placeholder="Наприклад: Еко-Кафетерій"
                      value={startupTitle}
                      onChange={(e) => setStartupTitle(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                        <Target size={12} /> Ціль (голосів)
                      </label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-900"
                        placeholder="100"
                        value={startupGoal}
                        onChange={(e) => setStartupGoal(e.target.value)}
                      />
                    </div>
                    <div className="flex-[2]">
                       <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                        <Tag size={12} /> Теги
                      </label>
                      <input 
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
                        placeholder="Екологія, IT, Спорт..."
                        value={startupTags}
                        onChange={(e) => setStartupTags(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LOST & FOUND SPECIFIC FIELDS */}
              {createMode === 'lost_found' && (
                <div className="space-y-3 mb-3 animate-slide-up">
                   <div className="flex gap-2">
                       <button 
                         onClick={() => setLostStatus('lost')}
                         className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${lostStatus === 'lost' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-100 text-slate-400 hover:border-rose-100'}`}
                       >
                         <AlertCircle size={18} /> ЗАГУБИВ
                       </button>
                       <button 
                         onClick={() => setLostStatus('found')}
                         className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${lostStatus === 'found' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400 hover:border-emerald-100'}`}
                       >
                         <CheckCircle2 size={18} /> ЗНАЙШОВ
                       </button>
                   </div>
                   <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Що саме?</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-900 placeholder-slate-400"
                      placeholder={lostStatus === 'lost' ? "Наприклад: Чорний рюкзак Nike" : "Наприклад: Зв'язка ключів"}
                      value={lostTitle}
                      onChange={(e) => setLostTitle(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* COMMON TEXT AREA */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">
                  {createMode === 'startup' ? 'Опис ідеї' : createMode === 'lost_found' ? 'Деталі (де, коли)' : 'Текст'}
                </label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-slate-800 placeholder-slate-400 font-medium"
                  placeholder={createMode === 'startup' ? "Опиши свою ідею детально..." : createMode === 'lost_found' ? "Де залишили, особливі прикмети..." : "Про що думаєш?"}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                ></textarea>
              </div>

              {/* IMAGE UPLOAD (POST & LOST MODES) */}
              {(createMode === 'post' || createMode === 'lost_found') && (
                <div className="mt-3">
                   <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                     <label className="flex flex-col items-center justify-center w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 flex-shrink-0">
                       <ImageIcon size={20} className="text-slate-400 mb-1" />
                       <span className="text-[10px] text-slate-500 font-bold">Додати</span>
                       <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                     
                     {previewImages.map((img, idx) => (
                       <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 group border border-slate-100">
                         <img src={img} className="w-full h-full object-cover" />
                         <button 
                           onClick={() => removeImage(idx)}
                           className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           <Trash2 size={12} />
                         </button>
                       </div>
                     ))}
                   </div>
                   {createMode === 'lost_found' && previewImages.length === 0 && (
                       <p className="text-xs text-rose-500 mt-1 font-medium">* Фото обов'язкове для знахідок</p>
                   )}
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between mt-4 flex-shrink-0 pt-2 border-t border-slate-50">
               <div></div> {/* Spacer, AI removed */}
              
              <Button onClick={handlePublish} disabled={( !content && createMode !== 'lost_found' ) || isPublishing} isLoading={isPublishing}>
                Опублікувати
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- OVERLAY MODALS --- */}
      <ImageViewer imageUrl={viewedImage} onClose={() => setViewedImage(null)} />
      
      <CommentModal
        post={commentingPost} 
        currentUser={currentUser!}
        onClose={() => setCommentingPost(null)}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onUserClick={handleUserClick}
      />
      
      {isEditingProfile && currentUser && (
          <EditProfileModal 
              user={currentUser} 
              onClose={() => setIsEditingProfile(false)} 
              onSave={handleSaveProfile}
              onError={(msg) => showToast('error', msg)}
          />
      )}

      {showMoodModal && currentUser && (
        <MoodTrackerModal
          onSelect={async (mood) => {
            await api.logMood(currentUser.id, mood);
            setShowMoodModal(false);
          }}
          onClose={() => setShowMoodModal(false)}
        />
      )}

      {joinTeamStartup && currentUser && (
        <JoinTeamModal
          startup={joinTeamStartup}
          userId={currentUser.id}
          onClose={() => setJoinTeamStartup(null)}
          onSuccess={async () => {
            const map = await api.fetchUserTeamRequestsMap(currentUser.id);
            setUserTeamRequestsMap(map);
            showToast('success', 'Заявку надіслано');
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {teamRequestsStartup && currentUser && (
        <TeamRequestsModal
          startup={teamRequestsStartup}
          currentUser={currentUser}
          onClose={() => setTeamRequestsStartup(null)}
          onSuccess={(msg) => { showToast('success', msg); loadData(); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* CSS for custom animations */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default App;