import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, ArrowLeft, Send, Loader2, Search } from 'lucide-react';
import type { User } from '../types';
import type { DMConversation, DMMessage } from '../types';
import * as api from '../services/api';
import { supabase } from '../services/supabase';

interface ChatScreenProps {
  currentUser: User;
  /** Якщо задано — одразу відкрити чат з цим користувачем (наприклад з профілю "Написати") */
  initialPeer?: User | null;
  onBack?: () => void;
  onOpenConversation?: (peer: User) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

export const ChatScreen: React.FC<ChatScreenProps> = ({
  currentUser,
  initialPeer,
  onBack,
  onOpenConversation
}) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activePeer, setActivePeer] = useState<User | null>(initialPeer ?? null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Та сама логіка, що й «Знайти співбесідника»: при initialPeer одразу відкрити чат з цим користувачем
  useEffect(() => {
    if (initialPeer) {
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      setActivePeer(initialPeer);
      onOpenConversation?.(initialPeer);
    } else {
      setActivePeer(null);
    }
  }, [initialPeer?.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.fetchConversations(currentUser.id).then((list) => {
      if (!cancelled) setConversations(list);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser.id]);

  useEffect(() => {
    if (!searchOpen) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim()) {
      setSearching(true);
      api.fetchProfilesList(40).then((users) => {
        const filtered = users.filter((u) => u.id !== currentUser.id);
        setSearchResults(filtered);
      }).finally(() => setSearching(false));
      return;
    }
    setSearching(true);
    searchDebounceRef.current = setTimeout(() => {
      api.searchProfiles(searchQuery.trim()).then((users) => {
        const filtered = users.filter((u) => u.id !== currentUser.id);
        setSearchResults(filtered);
      }).finally(() => setSearching(false));
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchOpen, searchQuery, currentUser.id]);

  useEffect(() => {
    if (!activePeer) {
      setConversationId(null);
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessagesLoading(true);
    api.getOrCreateConversation(currentUser.id, activePeer.id).then(({ id }) => {
      if (cancelled) return;
      setConversationId(id);
      return api.fetchDMMessages(id, currentUser.id);
    }).then((list) => {
      if (!cancelled && list) setMessages(list);
    }).finally(() => { if (!cancelled) setMessagesLoading(false); });
    return () => { cancelled = true; };
  }, [activePeer?.id, currentUser.id]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `conversation_id=eq.${conversationId}` },
        () => {
          api.fetchDMMessages(conversationId, currentUser.id).then(setMessages);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const openConversationWith = (peer: User) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setActivePeer(peer);
    onOpenConversation?.(peer);
  };

  const handleBackToList = () => {
    setActivePeer(null);
    setConversationId(null);
    setMessages([]);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    api.fetchConversations(currentUser.id).then(setConversations);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || !conversationId || sending) return;
    setSending(true);
    setInputValue('');
    try {
      await api.sendDMMessage(conversationId, currentUser.id, text);
      const list = await api.fetchDMMessages(conversationId, currentUser.id);
      setMessages(list);
    } finally {
      setSending(false);
    }
  };

  const showList = !activePeer && !searchOpen;
  const showSearch = !activePeer && searchOpen;
  const showConversation = !!activePeer;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full bg-white dark:bg-[#0a0a0a] overflow-hidden">
      {/* Хедер розмови: не скролиться — завжди видно */}
      {showConversation && (
        <div className="flex-shrink-0 flex items-center gap-2.5 px-2 py-2 bg-white dark:bg-[#0a0a0a] safe-area-pt border-b border-[#efefef] dark:border-[#1a1a1a]">
          <button
            type="button"
            onClick={handleBackToList}
            className="min-w-9 min-h-9 flex items-center justify-center rounded-full text-[#262626] dark:text-[#fafafa] hover:bg-[#f0f0f0] dark:hover:bg-[#262626] active:scale-95 touch-manipulation"
            aria-label="Назад до чатів"
          >
            <ArrowLeft size={20} />
          </button>
          <img
            src={activePeer.avatar}
            alt=""
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[15px] text-[#262626] dark:text-[#fafafa] truncate">{activePeer.name}</p>
            <p className="text-[12px] text-[#8e8e8e] dark:text-[#a3a3a3] truncate">{activePeer.grade || activePeer.role}</p>
          </div>
        </div>
      )}

      {/* Пошук: один ряд — назад + поле пошуку */}
      {showSearch && (
        <div className="flex-shrink-0 flex items-center gap-2 px-2 py-2 bg-white dark:bg-[#0a0a0a] safe-area-pt">
          <button
            type="button"
            onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
            className="min-w-9 min-h-9 flex items-center justify-center rounded-full text-[#262626] dark:text-[#fafafa] hover:bg-[#f0f0f0] dark:hover:bg-[#262626] active:scale-95 touch-manipulation flex-shrink-0"
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук"
            className="flex-1 min-h-9 px-3 rounded-lg bg-[#efefef] dark:bg-[#262626] border-0 text-[15px] text-[#262626] dark:text-[#fafafa] placeholder-[#8e8e8e] dark:placeholder-[#737373] focus:outline-none"
            autoFocus
            autoComplete="off"
          />
        </div>
      )}

      {/* Список чатів: один ряд — назад + кнопка пошуку */}
      {showList && (
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col min-h-0">
          <div className="flex items-center gap-2 px-2 py-2 safe-area-pt flex-shrink-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="min-w-9 min-h-9 flex items-center justify-center rounded-full text-[#262626] dark:text-[#fafafa] hover:bg-[#f0f0f0] dark:hover:bg-[#262626] active:scale-95 touch-manipulation"
                aria-label="Назад"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex-1 flex items-center gap-2 py-2 px-3 rounded-lg bg-[#efefef] dark:bg-[#262626] text-left min-w-0"
            >
              <Search size={18} className="text-[#8e8e8e] dark:text-[#a3a3a3] flex-shrink-0" />
              <span className="text-[15px] text-[#8e8e8e] dark:text-[#a3a3a3] truncate">Пошук</span>
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#8e8e8e] dark:text-[#737373]" size={24} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center flex-1 text-[#8e8e8e] dark:text-[#737373]">
              <MessageCircle size={40} className="opacity-50 mb-2" />
              <p className="text-sm">Поки немає розмов</p>
              <p className="text-xs mt-0.5">Пошук або «Написати» в профілі</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#f0f0f0] dark:divide-[#1a1a1a]">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => openConversationWith(c.peer)}
                    className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-[#fafafa] dark:hover:bg-[#141414] active:bg-[#f0f0f0] dark:active:bg-[#1a1a1a] transition-colors touch-manipulation"
                  >
                    <img
                      src={c.peer.avatar}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[15px] text-[#262626] dark:text-[#fafafa] truncate">{c.peer.name}</p>
                      {c.lastMessage ? (
                        <p className="text-[13px] text-[#8e8e8e] dark:text-[#a3a3a3] truncate">
                          {c.lastMessage.isFromMe ? 'Ви: ' : ''}{c.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-[13px] text-[#a3a3a3] dark:text-[#525252]">Немає повідомлень</p>
                      )}
                    </div>
                    {c.lastMessage && (
                      <span className="text-[11px] text-[#8e8e8e] dark:text-[#737373] flex-shrink-0">
                        {c.lastMessage.created_at}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Результати пошуку співбесідника */}
      {showSearch && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {searching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-[#8e8e8e] dark:text-[#737373]" size={22} />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 px-4 text-center text-[13px] text-[#8e8e8e] dark:text-[#a3a3a3]">
                Нікого не знайдено
              </div>
            ) : (
              <div className="divide-y divide-[#f0f0f0] dark:divide-[#1a1a1a]">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => openConversationWith(user)}
                    className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-[#fafafa] dark:hover:bg-[#141414] active:bg-[#f0f0f0] dark:active:bg-[#1a1a1a] transition-colors touch-manipulation"
                  >
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-medium text-[15px] text-[#262626] dark:text-[#fafafa] truncate">{user.name}</p>
                      <p className="text-[13px] text-[#8e8e8e] dark:text-[#a3a3a3] truncate">{user.grade || user.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Відкритий чат: листається тільки область повідомлень; шапка і ввід не скролять */}
      {showConversation && (
        <>
          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 py-2 space-y-2">
            {messagesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-[#8e8e8e] dark:text-[#737373]" size={22} />
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-[15px] leading-snug ${
                        m.isFromMe
                          ? 'bg-[#0095f6] text-white rounded-br-md'
                          : 'bg-[#efefef] dark:bg-[#262626] text-[#262626] dark:text-[#fafafa] rounded-bl-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`text-[10px] mt-0.5 ${m.isFromMe ? 'text-white/70' : 'text-[#737373] dark:text-[#a3a3a3]'}`}>
                        {m.created_at}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="flex-shrink-0 px-2 py-2 bg-white dark:bg-[#0a0a0a] border-t border-[#efefef] dark:border-[#1a1a1a] safe-area-pb"
          >
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Повідомлення"
                className="flex-1 min-h-10 px-4 py-2 rounded-full bg-[#efefef] dark:bg-[#262626] border-0 text-[15px] text-[#262626] dark:text-[#fafafa] placeholder-[#8e8e8e] dark:placeholder-[#737373] focus:outline-none"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || sending}
                className="min-w-10 min-h-10 flex items-center justify-center rounded-full bg-[#0095f6] text-white hover:bg-[#0084e0] disabled:opacity-40 disabled:pointer-events-none active:scale-95 touch-manipulation flex-shrink-0"
                aria-label="Надіслати"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
