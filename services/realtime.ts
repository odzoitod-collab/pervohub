import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type RealtimeTables = 'posts' | 'likes' | 'comments' | 'startups' | 'startup_votes' | 'lost_items';

type RealtimeCallback = (table: RealtimeTables) => void;

const DEBOUNCE_MS = 600;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingTables = new Set<RealtimeTables>();

function scheduleRefresh(cb: RealtimeCallback) {
  const flush = () => {
    if (pendingTables.size === 0) return;
    const tables = new Set(pendingTables);
    pendingTables.clear();
    debounceTimer = null;
    tables.forEach(t => cb(t));
  };

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flush, DEBOUNCE_MS);
}

export function subscribeRealtime(onRefresh: RealtimeCallback): () => void {
  const refresh = (table: RealtimeTables) => {
    pendingTables.add(table);
    scheduleRefresh(onRefresh);
  };

  const channel = supabase
    .channel('schoolhub-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => refresh('posts'))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => refresh('posts'))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, () => refresh('posts'))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'likes' }, () => refresh('posts'))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => refresh('comments'))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, () => refresh('comments'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'startups' }, () => refresh('startups'))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'startup_votes' }, () => refresh('startup_votes'))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'startup_votes' }, () => refresh('startup_votes'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_items' }, () => refresh('lost_items'))
    .subscribe();

  return () => {
    supabase.removeChannel(channel as RealtimeChannel);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    pendingTables.clear();
  };
}
