import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import type { UserBadgeGroup, UserBadgeWithDetails } from '../types';

/**
 * Завантажує user_badges для користувача та групує їх за badge_id (стекинг).
 * Кожна група має: badge, count, items (всі записи для історії).
 * refreshTrigger: змініть значення, щоб примусово перезавантажити (наприклад після видачі відзнаки).
 */
export function useUserBadges(userId: string | null, refreshTrigger = 0) {
  const [groups, setGroups] = useState<UserBadgeGroup[]>([]);
  const [rawItems, setRawItems] = useState<UserBadgeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setGroups([]);
      setRawItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await api.fetchUserBadges(userId);
      setRawItems(items);
      const grouped = groupUserBadgesByBadgeId(items);
      setGroups(grouped);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Не вдалося завантажити відзнаки'));
      setGroups([]);
      setRawItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  return { groups, rawItems, loading, error, refetch: load };
}

/**
 * Групує масив UserBadgeWithDetails за badge_id.
 * Результат: масив UserBadgeGroup з полями badge, count, items.
 */
export function groupUserBadgesByBadgeId(items: UserBadgeWithDetails[]): UserBadgeGroup[] {
  const byBadgeId = items.reduce<Record<string, UserBadgeWithDetails[]>>((acc, item) => {
    const id = item.badge_id;
    if (!acc[id]) acc[id] = [];
    acc[id].push(item);
    return acc;
  }, {});

  return Object.values(byBadgeId).map((list) => {
    const first = list[0];
    return {
      badge: first.badge,
      count: list.length,
      items: list
    };
  });
}
