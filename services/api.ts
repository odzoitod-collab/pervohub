import { supabase } from './supabase';
import { Post, User, Startup, LostItem, Comment, UserRole, StartupStatus, isSchoolAdmin, BellSlot, Event, Notification, PortfolioItem, PortfolioItemType, MoodLog, StartupTeamRequest, TeamRequestStatus, Badge, UserBadgeWithDetails } from '../types';

// --- Types Mappers ---
// Converts Supabase DB response to our App Types

const mapProfileToUser = (profile: any): User => {
  if (!profile) {
    return {
      id: '',
      name: 'Невідомий',
      email: '',
      role: UserRole.STUDENT,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=unknown',
      bio: ''
    };
  }
  return {
    id: profile.id,
    name: profile.name || 'Користувач',
    email: profile.email,
    role: (profile.role as UserRole) || UserRole.STUDENT,
    grade: profile.grade,
    avatar: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.id}`,
    bio: profile.bio
  };
};

// --- Auth & Profiles ---

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile) return mapProfileToUser(profile);
  
  // Fallback if profile doesn't exist yet but user is logged in
  return {
    id: session.user.id,
    name: session.user.user_metadata.name || 'User',
    role: session.user.user_metadata.role || UserRole.STUDENT,
    grade: session.user.user_metadata.grade,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.email}`,
    email: session.user.email
  };
};

export const getProfile = async (userId: string): Promise<User | null> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !profile) return null;
  return mapProfileToUser(profile);
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.grade !== undefined) payload.grade = updates.grade;
  if (updates.bio !== undefined) payload.bio = updates.bio;
  if (updates.avatar !== undefined) payload.avatar_url = updates.avatar;
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return mapProfileToUser(data);
};

/** Зберегти OneSignal Player ID для поточного користувача (для пуш-уведомлень) */
export const saveOnesignalId = async (userId: string, onesignalId: string | null): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ onesignal_id: onesignalId })
    .eq('id', userId);
  if (error) throw error;
};

// --- Storage ---
// Bucket "post" — фото постів та бюро знахідок (Public)
// Bucket "images" — аватарки

const POST_BUCKET = 'post';
const IMAGES_BUCKET = 'images';
const PORTFOLIO_BUCKET = 'portfolio';

export const uploadPostImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from(POST_BUCKET)
    .upload(fileName, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(POST_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
};

export const uploadImage = async (file: File, folder?: string): Promise<string> => {
  return uploadPostImage(file);
};

export const uploadPortfolioImage = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `avatars/${userId}_${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(IMAGES_BUCKET)
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

// --- Posts ---

export const fetchPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(*),
      likes:likes(count),
      comments:comments(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((p: any) => ({
    id: p.id,
    author: mapProfileToUser(p.author ?? null),
    content: p.content,
    images: p.images || [],
    isAnnouncement: p.is_announcement,
    timestamp: new Date(p.created_at).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    likes: p.likes?.[0]?.count || 0,
    commentsCount: p.comments?.[0]?.count || 0
  }));
};

export const createPost = async (userId: string, content: string, images: string[], isAnnouncement: boolean) => {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: userId,
      content,
      images,
      is_announcement: isAnnouncement
    })
    .select('*, author:profiles(*)')
    .single();

  if (error) throw error;
  return data;
};

// --- Startups ---

export const fetchStartups = async (): Promise<Startup[]> => {
  const { data, error } = await supabase
    .from('startups')
    .select(`*, author:profiles(*)`)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((s: any) => ({
    id: s.id,
    author: mapProfileToUser(s.author ?? null),
    title: s.title,
    description: s.description,
    goal: s.goal,
    currentSupport: s.current_support ?? 0,
    tags: s.tags || [],
    status: (s.status || 'pending') as StartupStatus
  }));
};

export const fetchUserVotedStartupIds = async (userId: string): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from('startup_votes')
    .select('startup_id')
    .eq('user_id', userId);
  if (error) return new Set();
  return new Set((data || []).map((r: { startup_id: string }) => r.startup_id));
};

export const voteStartup = async (startupId: string, userId: string): Promise<{ currentSupport: number }> => {
  const { data: existing } = await supabase
    .from('startup_votes')
    .select('id')
    .eq('startup_id', startupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('startup_votes').delete().eq('startup_id', startupId).eq('user_id', userId);
  } else {
    await supabase.from('startup_votes').insert({ startup_id: startupId, user_id: userId });
  }

  const { count } = await supabase
    .from('startup_votes')
    .select('*', { count: 'exact', head: true })
    .eq('startup_id', startupId);
  const newCount = count ?? 0;
  await supabase.from('startups').update({ current_support: newCount }).eq('id', startupId);
  return { currentSupport: newCount };
};

export const updateStartupStatus = async (startupId: string, status: 'accepted' | 'rejected', userRole: string): Promise<void> => {
  if (!isSchoolAdmin(userRole)) throw new Error('Немає прав');
  const { error } = await supabase.from('startups').update({ status }).eq('id', startupId);
  if (error) throw error;
};

export const deleteStartup = async (startupId: string, userRole: string): Promise<void> => {
  if (!isSchoolAdmin(userRole)) throw new Error('Немає прав');
  const { error } = await supabase.from('startups').delete().eq('id', startupId);
  if (error) throw error;
};

export const createStartup = async (userId: string, startup: Omit<Startup, 'id' | 'author' | 'currentSupport'>) => {
  const { error } = await supabase
    .from('startups')
    .insert({
      author_id: userId,
      title: startup.title,
      description: startup.description,
      goal: startup.goal,
      tags: startup.tags,
      current_support: 0,
      status: 'pending'
    });

  if (error) throw error;
};

// --- Lost & Found ---

export const fetchLostItems = async (): Promise<LostItem[]> => {
  const { data, error } = await supabase
    .from('lost_items')
    .select(`*, author:profiles(*)`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    id: item.id,
    author: mapProfileToUser(item.author ?? null),
    title: item.title,
    description: item.description,
    status: item.status,
    date: new Date(item.created_at).toLocaleDateString('uk-UA'),
    image: item.image,
    contactInfo: item.contact_info
  }));
};

export const createLostItem = async (userId: string, item: Omit<LostItem, 'id' | 'author' | 'date'>) => {
  const { error } = await supabase
    .from('lost_items')
    .insert({
      author_id: userId,
      title: item.title,
      description: item.description,
      status: item.status,
      image: item.image,
      contact_info: item.contactInfo
    });

  if (error) throw error;
};

export const updateLostItemStatus = async (itemId: string, status: 'lost' | 'found', userId: string, userRole: string): Promise<void> => {
  const { data: item } = await supabase.from('lost_items').select('author_id').eq('id', itemId).single();
  if (!item) throw new Error('Оголошення не знайдено');
  const isAdmin = isSchoolAdmin(userRole);
  const isOwner = item.author_id === userId;
  if (!isOwner && !isAdmin) throw new Error('Немає прав');
  const { error } = await supabase.from('lost_items').update({ status }).eq('id', itemId);
  if (error) throw error;
};

export const deleteLostItem = async (itemId: string, userId: string, userRole: string): Promise<void> => {
  const { data: item } = await supabase.from('lost_items').select('author_id').eq('id', itemId).single();
  if (!item) throw new Error('Оголошення не знайдено');
  const isAdmin = isSchoolAdmin(userRole);
  const isOwner = item.author_id === userId;
  if (!isOwner && !isAdmin) throw new Error('Немає прав на видалення');
  const { error } = await supabase.from('lost_items').delete().eq('id', itemId);
  if (error) throw error;
};

// --- Likes ---

export const fetchUserLikedPostIds = async (userId: string): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId);
  if (error) return new Set();
  return new Set((data || []).map((r: { post_id: string }) => r.post_id));
};

export const toggleLike = async (postId: string, userId: string): Promise<{ likes: number }> => {
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: userId });
  }

  const { count } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  return { likes: count ?? 0 };
};

// --- Comments ---

export const fetchComments = async (postId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`*, author:profiles(*)`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((c: any) => ({
    id: c.id,
    author: mapProfileToUser(c.author ?? null),
    text: c.text,
    timestamp: new Date(c.created_at).toLocaleString('uk-UA')
  }));
};

export const deletePost = async (postId: string, userId: string, userRole: string): Promise<void> => {
  const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single();
  if (!post) throw new Error('Пост не знайдено');
  const isAdmin = isSchoolAdmin(userRole);
  const isOwner = post.author_id === userId;
  if (!isOwner && !isAdmin) throw new Error('Немає прав на видалення');
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
};

export const deleteComment = async (commentId: string, userId: string, userRole: string): Promise<void> => {
  const { data: comment } = await supabase.from('comments').select('author_id').eq('id', commentId).single();
  if (!comment) throw new Error('Коментар не знайдено');
  const isAdmin = isSchoolAdmin(userRole);
  const isOwner = comment.author_id === userId;
  if (!isOwner && !isAdmin) throw new Error('Немає прав на видалення');
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
};

export const addComment = async (userId: string, postId: string, text: string) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: userId,
      text
    })
    .select('*, author:profiles(*)')
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    author: mapProfileToUser(data.author ?? null),
    text: data.text,
    timestamp: 'Щойно'
  };
};

// --- Search ---

/** Список профілів без пошукового запиту (для початкового показу в пошуку акаунтів/чату) */
export const fetchProfilesList = async (limit = 40): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name', { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data || []).map((p: any) => mapProfileToUser(p));
};

export const searchProfiles = async (query: string): Promise<User[]> => {
  if (!query.trim()) return [];
  const q = query.trim().replace(/%/g, '').slice(0, 50);
  if (!q) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`name.ilike.%${q}%,grade.ilike.%${q}%`)
    .limit(30);

  if (error) return [];
  return (data || []).map((p: any) => mapProfileToUser(p));
};

// --- Trust Box ---

export interface TrustMessage {
  id: string;
  message: string;
  created_at: string;
  is_anonymous: boolean;
  author?: { name: string; grade?: string };
}

export const sendTrustMessage = async (message: string, sendAnonymously: boolean, userId: string | null) => {
  const payload: { message: string; is_anonymous: boolean; author_id?: string | null } = {
    message,
    is_anonymous: sendAnonymously
  };
  if (!sendAnonymously && userId) payload.author_id = userId;
  else payload.author_id = null;
  const { error } = await supabase.from('trust_box').insert(payload);
  if (error) throw error;
};

export const fetchTrustMessages = async (): Promise<TrustMessage[]> => {
  const { data, error } = await supabase
    .from('trust_box')
    .select('id, message, created_at, is_anonymous, author:profiles!author_id(name, grade)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: m.id,
    message: m.message,
    created_at: new Date(m.created_at).toLocaleString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    is_anonymous: m.is_anonymous ?? true,
    author: m.author ? { name: m.author.name || 'Користувач', grade: m.author.grade } : undefined
  }));
};

// --- Direct Messages (Дірект) ---

/** Повертає [participant_1, participant_2] так, щоб participant_1 < participant_2 за UUID */
function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export const getOrCreateConversation = async (myId: string, peerId: string): Promise<{ id: string }> => {
  const [p1, p2] = orderedPair(myId, peerId);
  const { data: existing } = await supabase
    .from('dm_conversations')
    .select('id')
    .eq('participant_1', p1)
    .eq('participant_2', p2)
    .maybeSingle();
  if (existing) return { id: existing.id };
  const { data: created, error } = await supabase
    .from('dm_conversations')
    .insert({ participant_1: p1, participant_2: p2 })
    .select('id')
    .single();
  if (error) throw error;
  return { id: created.id };
};

export interface DMConversationRow {
  id: string;
  participant_1: string;
  participant_2: string;
  updated_at: string;
  peer?: any;
  last_message?: { content: string; created_at: string; sender_id: string } | null;
}

export const fetchConversations = async (myId: string): Promise<import('../types').DMConversation[]> => {
  const { data: rows, error } = await supabase
    .from('dm_conversations')
    .select('id, participant_1, participant_2, updated_at')
    .or(`participant_1.eq.${myId},participant_2.eq.${myId}`)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const convIds = rows.map((r: any) => r.id);
  const { data: lastMessages } = await supabase
    .from('dm_messages')
    .select('conversation_id, content, created_at, sender_id')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false });

  const lastByConv = new Map<string, { content: string; created_at: string; sender_id: string }>();
  (lastMessages || []).forEach((m: any) => {
    if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
  });

  const peerIds = new Set<string>();
  rows.forEach((r: any) => {
    if (r.participant_1 !== myId) peerIds.add(r.participant_1);
    if (r.participant_2 !== myId) peerIds.add(r.participant_2);
  });
  const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url, role, grade').in('id', [...peerIds]);
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, mapProfileToUser(p)]));

  return rows.map((r: any) => {
    const peerId = r.participant_1 === myId ? r.participant_2 : r.participant_1;
    const peer = profileMap.get(peerId) || { id: peerId, name: 'Користувач', avatar: '', role: 'Учень' as UserRole };
    const last = lastByConv.get(r.id);
    return {
      id: r.id,
      peer,
      lastMessage: last
        ? {
            content: last.content,
            created_at: new Date(last.created_at).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            isFromMe: last.sender_id === myId
          }
        : undefined,
      updated_at: r.updated_at
    };
  });
};

export const fetchDMMessages = async (conversationId: string, myId: string): Promise<import('../types').DMMessage[]> => {
  const { data, error } = await supabase
    .from('dm_messages')
    .select('id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: m.id,
    sender_id: m.sender_id,
    content: m.content,
    created_at: new Date(m.created_at).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    isFromMe: m.sender_id === myId
  }));
};

export const sendDMMessage = async (conversationId: string, senderId: string, content: string): Promise<void> => {
  const { error } = await supabase.from('dm_messages').insert({ conversation_id: conversationId, sender_id: senderId, content: content.trim() });
  if (error) throw error;
};

// --- Bell Schedule ---
export const fetchBellSchedule = async (): Promise<BellSlot[]> => {
  const { data, error } = await supabase
    .from('bell_schedule')
    .select('*')
    .order('lesson_number', { ascending: true });

  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    lesson_number: r.lesson_number,
    start_time: r.start_time ? String(r.start_time).slice(0, 5) : '',
    end_time: r.end_time ? String(r.end_time).slice(0, 5) : '',
    name: r.name || undefined
  }));
};

export const upsertBellSchedule = async (slots: Omit<BellSlot, 'id'>[], userRole: string): Promise<void> => {
  if (!isSchoolAdmin(userRole)) throw new Error('Немає прав');
  for (const slot of slots) {
    const { error } = await supabase
      .from('bell_schedule')
      .upsert(
        {
          lesson_number: slot.lesson_number,
          start_time: slot.start_time,
          end_time: slot.end_time,
          name: slot.name || null
        },
        { onConflict: 'lesson_number' }
      );
    if (error) throw error;
  }
};

// --- Events ---
export const fetchEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    event_date: e.event_date,
    event_time: e.event_time ? String(e.event_time).slice(0, 5) : undefined,
    description: e.description || undefined,
    created_at: e.created_at
  }));
};

export const createEvent = async (event: Omit<Event, 'id' | 'created_at'>, userId: string, userRole: string): Promise<Event> => {
  if (!isSchoolAdmin(userRole)) throw new Error('Немає прав');
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: event.title,
      event_date: event.event_date,
      event_time: event.event_time || null,
      description: event.description || null,
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    title: data.title,
    event_date: data.event_date,
    event_time: data.event_time ? String(data.event_time).slice(0, 5) : undefined,
    description: data.description || undefined,
    created_at: data.created_at
  };
};

export const updateEvent = async (eventId: string, updates: Partial<Pick<Event, 'title' | 'event_date' | 'event_time' | 'description'>>, userRole: string): Promise<void> => {
  if (!isSchoolAdmin(userRole)) throw new Error('Немає прав');
  const { error } = await supabase
    .from('events')
    .update({
      title: updates.title,
      event_date: updates.event_date,
      event_time: updates.event_time ?? null,
      description: updates.description ?? null
    })
    .eq('id', eventId);
  if (error) throw error;
};

export const deleteEvent = async (eventId: string, userRole: string): Promise<void> => {
  if (!isSchoolAdmin(userRole)) throw new Error('Немає прав');
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
};

// --- Notifications: likes and comments on user's posts ---
export const fetchUserNotifications = async (userId: string): Promise<Notification[]> => {
  const { data: myPosts } = await supabase
    .from('posts')
    .select('id, content')
    .eq('author_id', userId);
  if (!myPosts?.length) return [];

  const postIds = myPosts.map((p: any) => p.id);
  const postPreviews: Record<string, string> = {};
  myPosts.forEach((p: any) => {
    postPreviews[p.id] = (p.content || '').slice(0, 50) + (p.content?.length > 50 ? '...' : '');
  });

  const notifications: (Notification & { _sortAt: number })[] = [];

  const { data: likes } = await supabase
    .from('likes')
    .select('id, post_id, user_id, created_at')
    .in('post_id', postIds)
    .neq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (likes?.length) {
    const likerIds = [...new Set(likes.map((l: any) => l.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', likerIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, mapProfileToUser(p)]));
    for (const l of likes) {
      const actor = profileMap.get(l.user_id);
      if (actor) {
        const createdAt = new Date(l.created_at).getTime();
        notifications.push({
          id: `like-${l.id}`,
          type: 'like',
          postId: l.post_id,
          postPreview: postPreviews[l.post_id] || '',
          actor,
          timestamp: new Date(l.created_at).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          _sortAt: createdAt
        });
      }
    }
  }

  const { data: comments } = await supabase
    .from('comments')
    .select('id, post_id, author_id, text, created_at')
    .in('post_id', postIds)
    .neq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (comments?.length) {
    const commenterIds = [...new Set(comments.map((c: any) => c.author_id))];
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', commenterIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, mapProfileToUser(p)]));
    for (const c of comments) {
      const actor = profileMap.get(c.author_id);
      if (actor) {
        const createdAt = new Date(c.created_at).getTime();
        notifications.push({
          id: `comment-${c.id}`,
          type: 'comment',
          postId: c.post_id,
          postPreview: postPreviews[c.post_id] || '',
          actor,
          text: c.text,
          timestamp: new Date(c.created_at).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          _sortAt: createdAt
        });
      }
    }
  }

  notifications.sort((a, b) => b._sortAt - a._sortAt);
  return notifications.slice(0, 50).map(({ _sortAt, ...n }) => n);
};

// --- Portfolio (Фіча 1) ---
export const fetchPortfolioItems = async (userId: string): Promise<PortfolioItem[]> => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    type: p.type as PortfolioItemType,
    reference_id: p.reference_id ?? null,
    title: p.title,
    image_url: p.image_url ?? null,
    created_at: p.created_at
  }));
};

export const createPortfolioItem = async (
  userId: string,
  item: { type: PortfolioItemType; reference_id?: string | null; title: string; image_url?: string | null }
): Promise<PortfolioItem> => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({
      user_id: userId,
      type: item.type,
      reference_id: item.reference_id ?? null,
      title: item.title,
      image_url: item.image_url ?? null
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    user_id: data.user_id,
    type: data.type,
    reference_id: data.reference_id ?? null,
    title: data.title,
    image_url: data.image_url ?? null,
    created_at: data.created_at
  };
};

export const deletePortfolioItem = async (itemId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);
  if (error) throw error;
};

// --- Mood Tracker (Фіча 2) ---
export const logMood = async (userId: string, mood: string): Promise<MoodLog> => {
  const { data, error } = await supabase
    .from('mood_logs')
    .insert({ user_id: userId, mood })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    user_id: data.user_id,
    mood: data.mood,
    created_at: data.created_at
  };
};

export const hasLoggedMoodToday = async (userId: string): Promise<boolean> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const { count, error } = await supabase
    .from('mood_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  if (error) return false;
  return (count ?? 0) > 0;
};

// --- Startup Team Requests (Фіча 3) ---
export const createTeamRequest = async (
  startupId: string,
  userId: string,
  message: string
): Promise<StartupTeamRequest> => {
  const { data, error } = await supabase
    .from('startup_team_requests')
    .insert({ startup_id: startupId, user_id: userId, message: message.trim() || null, status: 'pending' })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    startup_id: data.startup_id,
    user_id: data.user_id,
    message: data.message ?? null,
    status: data.status as TeamRequestStatus,
    created_at: data.created_at
  };
};

export const fetchTeamRequests = async (startupId: string): Promise<(StartupTeamRequest & { applicant?: User })[]> => {
  const { data, error } = await supabase
    .from('startup_team_requests')
    .select('*, applicant:profiles!user_id(*)')
    .eq('startup_id', startupId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    startup_id: r.startup_id,
    user_id: r.user_id,
    message: r.message ?? null,
    status: r.status as TeamRequestStatus,
    created_at: r.created_at,
    applicant: r.applicant ? mapProfileToUser(r.applicant) : undefined
  }));
};

export const updateTeamRequestStatus = async (
  requestId: string,
  status: 'accepted' | 'rejected',
  startupAuthorId: string
): Promise<void> => {
  const { data: req } = await supabase
    .from('startup_team_requests')
    .select('startup_id')
    .eq('id', requestId)
    .single();

  if (!req) throw new Error('Заявку не знайдено');

  const { data: startup } = await supabase
    .from('startups')
    .select('author_id')
    .eq('id', req.startup_id)
    .single();

  if (!startup || startup.author_id !== startupAuthorId) throw new Error('Немає прав');

  const { error } = await supabase
    .from('startup_team_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) throw error;
};

export const fetchUserTeamRequestForStartup = async (
  startupId: string,
  userId: string
): Promise<StartupTeamRequest | null> => {
  const { data, error } = await supabase
    .from('startup_team_requests')
    .select('*')
    .eq('startup_id', startupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    startup_id: data.startup_id,
    user_id: data.user_id,
    message: data.message ?? null,
    status: data.status as TeamRequestStatus,
    created_at: data.created_at
  };
};

export const fetchUserTeamRequestsMap = async (userId: string): Promise<Map<string, StartupTeamRequest>> => {
  const { data, error } = await supabase
    .from('startup_team_requests')
    .select('*')
    .eq('user_id', userId);

  if (error) return new Map();
  const map = new Map<string, StartupTeamRequest>();
  (data || []).forEach((r: any) => {
    map.set(r.startup_id, {
      id: r.id,
      startup_id: r.startup_id,
      user_id: r.user_id,
      message: r.message ?? null,
      status: r.status as TeamRequestStatus,
      created_at: r.created_at
    });
  });
  return map;
};

export const fetchPendingTeamRequestsCount = async (startupId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('startup_team_requests')
    .select('*', { count: 'exact', head: true })
    .eq('startup_id', startupId)
    .eq('status', 'pending');
  if (error) return 0;
  return count ?? 0;
};

export const fetchNextEvent = async (): Promise<Event | null> => {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(10);
  if (!data?.length) return null;
  const now = new Date();
  for (const e of data) {
    const d = new Date(e.event_date);
    if (e.event_time) {
      const [h, m] = String(e.event_time).slice(0, 5).split(':').map(Number);
      d.setHours(h ?? 0, m ?? 0, 0, 0);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    if (d >= now) {
      return {
        id: e.id,
        title: e.title,
        event_date: e.event_date,
        event_time: e.event_time ? String(e.event_time).slice(0, 5) : undefined,
        description: e.description || undefined,
        created_at: e.created_at
      };
    }
  }
  return null;
};

// --- Badges (Відзнаки) ---

export const fetchBadges = async (): Promise<Badge[]> => {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('rarity', { ascending: true });
  if (error) throw error;
  return (data || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    icon: b.icon,
    description: b.description ?? null,
    rarity: b.rarity,
    color_from: b.color_from ?? '#6366f1',
    color_to: b.color_to ?? '#8b5cf6',
    created_at: b.created_at
  }));
};

export const fetchUserBadges = async (userId: string): Promise<UserBadgeWithDetails[]> => {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      id,
      user_id,
      badge_id,
      awarded_by,
      comment,
      created_at,
      badge:badges(*),
      awarder:profiles!awarded_by(id, name, avatar_url, role, grade)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((ub: any) => ({
    id: ub.id,
    user_id: ub.user_id,
    badge_id: ub.badge_id,
    awarded_by: ub.awarded_by,
    comment: ub.comment,
    created_at: ub.created_at,
    badge: {
      id: ub.badge?.id,
      name: ub.badge?.name,
      icon: ub.badge?.icon,
      description: ub.badge?.description ?? null,
      rarity: ub.badge?.rarity,
      color_from: ub.badge?.color_from ?? '#6366f1',
      color_to: ub.badge?.color_to ?? '#8b5cf6',
      created_at: ub.badge?.created_at
    },
    awarder: ub.awarder ? mapProfileToUser(ub.awarder) : undefined
  }));
};

export const awardBadge = async (
  userId: string,
  badgeId: string,
  awardedBy: string,
  comment: string
): Promise<void> => {
  const { error } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badgeId,
      awarded_by: awardedBy,
      comment: comment.trim()
    });
  if (error) throw error;
};

// --- Подяки вчителю (тільки від учнів, тільки для вчителів) ---

export const sendThankToTeacher = async (
  toTeacherId: string,
  fromUserId: string,
  message: string
): Promise<void> => {
  const { error } = await supabase.from('teacher_thanks').insert({
    from_user_id: fromUserId,
    to_user_id: toTeacherId,
    message: message.trim() || null
  });
  if (error) throw error;
};

export const fetchTeacherThanks = async (teacherId: string): Promise<import('../types').TeacherThank[]> => {
  const { data, error } = await supabase
    .from('teacher_thanks')
    .select('id, message, created_at, from_user:profiles!from_user_id(id, name, avatar_url, role, grade)')
    .eq('to_user_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id,
    from_user: mapProfileToUser(t.from_user || {}),
    message: t.message ?? null,
    created_at: new Date(t.created_at).toLocaleString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }));
};
