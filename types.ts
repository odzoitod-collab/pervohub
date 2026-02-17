export enum UserRole {
  STUDENT = 'Учень',
  TEACHER = 'Вчитель',
  SCHOOL_ADMIN = 'Адміністрація закладу',
  PARENT = 'Батько',
  DIRECTOR = 'Директор',  // legacy, treated as SCHOOL_ADMIN
  ADMIN = 'Адмін',        // legacy, treated as SCHOOL_ADMIN
  ADMINISTRATOR = 'Адміністратор'  // legacy, treated as SCHOOL_ADMIN
}

export const ROLE_CONFIRM_CODES: Record<string, string> = {
  [UserRole.TEACHER]: '200705',
  [UserRole.SCHOOL_ADMIN]: '197822',
  [UserRole.PARENT]: '197923'
};

export function isSchoolAdmin(role: string): boolean {
  return role === UserRole.SCHOOL_ADMIN || role === 'Директор' || role === 'Адмін' || role === 'Адміністратор';
}

export type StartupStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  grade?: string; // e.g., "10-A"
  email?: string;
  bio?: string;
}

export interface Comment {
  id: string;
  author: User;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  likes: number;
  commentsCount: number; // Changed from 'comments' number to count
  commentsData?: Comment[]; // Actual comments
  isAnnouncement?: boolean;
  images?: string[]; // Multiple images support
}

export interface Startup {
  id: string;
  author: User;
  title: string;
  description: string;
  goal: number;
  currentSupport: number;
  tags: string[];
  status?: StartupStatus;
}

export type LostStatus = 'lost' | 'found';

export interface LostItem {
  id: string;
  author: User;
  title: string;
  description: string; // "Де знайшов/загубив"
  status: LostStatus;
  date: string;
  image: string; // Mandatory for lost items usually
  contactInfo?: string; // Optional place description e.g. "At security"
}

export interface BellSlot {
  id: string;
  lesson_number: number;
  start_time: string; // "HH:mm"
  end_time: string;   // "HH:mm"
  name?: string;
}

export interface Event {
  id: string;
  title: string;
  event_date: string;  // "YYYY-MM-DD"
  event_time?: string; // "HH:mm"
  description?: string;
  created_at?: string;
}

export enum Tab {
  HOME = 'home',
  SEARCH = 'search',
  STARTUPS = 'startups',
  LOST_FOUND = 'lost_found',
  CREATE = 'create',
  TRUST_BOX = 'trust_box',
  PROFILE = 'profile',
  NOTIFICATIONS = 'notifications',
  SERVICES = 'services',
  SCHEDULE = 'schedule',
  ADMIN = 'admin'
}

export type NotificationType = 'like' | 'comment';

// Фіча 1: Цифрове портфоліо
export type PortfolioItemType = 'post' | 'startup' | 'certificate';

export interface PortfolioItem {
  id: string;
  user_id: string;
  type: PortfolioItemType;
  reference_id: string | null;
  title: string;
  image_url: string | null;
  created_at: string;
}

// Фіча 2: Трекер емоцій
export type MoodValue = 'great' | 'good' | 'neutral' | 'sad' | 'angry';

export interface MoodLog {
  id: string;
  user_id: string;
  mood: string;
  created_at: string;
}

// Фіча 3: Командоутворення
export type TeamRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface StartupTeamRequest {
  id: string;
  startup_id: string;
  user_id: string;
  message: string | null;
  status: TeamRequestStatus;
  created_at: string;
  applicant?: User;
}

export interface Notification {
  id: string;
  type: NotificationType;
  postId: string;
  postPreview: string;
  actor: User;
  text?: string; // for comments
  timestamp: string;
}