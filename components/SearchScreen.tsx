import React, { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
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
    setLoading(true);
    setHasSearched(true);
    try {
      const users = q.trim()
        ? await api.searchProfiles(q)
        : await api.fetchProfilesList(40);
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), query.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  return (
    <div className="pb-24 md:pb-0 animate-fade-in min-h-0 flex flex-col">
      {/* Мінімалістична шапка: тільки поле пошуку */}
      <div className="flex-shrink-0 px-1 py-2 md:py-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e8e] dark:text-[#737373]" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук"
            className="w-full bg-[#efefef] dark:bg-[#262626] border-0 rounded-lg py-2.5 pl-9 pr-3 text-[15px] text-[#262626] dark:text-[#fafafa] placeholder-[#8e8e8e] dark:placeholder-[#737373] focus:outline-none focus:ring-0"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#8e8e8e] dark:text-[#737373]" size={24} />
          </div>
        ) : !hasSearched ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#8e8e8e] dark:text-[#737373]">
            <SearchIcon size={32} className="opacity-50 mb-2" />
            <p className="text-sm">Введи ім'я або клас</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#8e8e8e] dark:text-[#737373]">
            <p className="text-sm">Нічого не знайдено</p>
          </div>
        ) : (
          <div className="divide-y divide-[#efefef] dark:divide-[#262626]">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => onUserClick(user)}
                className="w-full flex items-center gap-3 px-1 py-3 hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] active:bg-[#efefef] dark:active:bg-[#262626] transition-colors text-left"
              >
                <img
                  src={user.avatar}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#262626] dark:text-[#fafafa] truncate text-[15px]">{user.name}</p>
                  <p className="text-[13px] text-[#8e8e8e] dark:text-[#a3a3a3] truncate">
                    {user.role}{user.grade ? ` · ${user.grade}` : ''}
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
