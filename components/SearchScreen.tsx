import React, { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, User, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';
import * as api from '../services/api';

interface SearchScreenProps {
  onUserClick: (user: UserType) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onUserClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const users = await api.searchProfiles(q);
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  return (
    <div className="pb-24 md:pb-0 animate-fade-in">
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-white/95 backdrop-blur-md border-b border-[#efefef] lg:bg-transparent lg:border-0 lg:relative lg:mx-0 lg:px-0 lg:py-0 lg:mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук людей за ім'ям чи класом..."
            className="w-full bg-[#efefef] border-0 rounded-2xl py-3.5 pl-12 pr-4 text-[15px] text-[#262626] placeholder-[#8e8e8e] focus:ring-2 focus:ring-[#c7c7c7] focus:outline-none transition-all"
            autoFocus
          />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : !hasSearched || !query.trim() ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <SearchIcon size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium">Знайди однокласників і вчителів</p>
            <p className="text-xs mt-1">Введи ім'я або клас</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <User size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Нічого не знайдено</p>
            <p className="text-xs mt-1">Спробуй інший пошуковий запит</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#efefef] overflow-hidden divide-y divide-[#efefef]">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => onUserClick(user)}
                className="w-full flex items-center gap-4 p-4 hover:bg-[#fafafa] active:bg-[#f5f5f5] transition-colors text-left"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#efefef]"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#262626] truncate">{user.name}</p>
                  <p className="text-sm text-[#8e8e8e]">
                    {user.role}
                    {user.grade && ` • ${user.grade}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
