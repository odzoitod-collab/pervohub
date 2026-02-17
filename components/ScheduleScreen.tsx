import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  Bell
} from 'lucide-react';
import { BellSlot, Event, User } from '../types';
import { isSchoolAdmin } from '../types';
import {
  fetchBellSchedule,
  fetchEvents,
  upsertBellSchedule,
  createEvent,
  updateEvent,
  deleteEvent
} from '../services/api';
import { Button } from './Button';

interface ScheduleScreenProps {
  currentUser: User;
  onToast?: (type: 'success' | 'error' | 'loading', msg: string) => void;
}

// Відлік до події: дні, години, хвилини, секунди
function useCountdown(targetDate: string | null, targetTime?: string | null) {
  const [diff, setDiff] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const now = new Date();
      let end = new Date(targetDate);
      if (targetTime) {
        const [h, m] = targetTime.split(':').map(Number);
        end.setHours(h ?? 0, m ?? 0, 0, 0);
      } else {
        end.setHours(23, 59, 59, 999);
      }

      const ms = end.getTime() - now.getTime();
      if (ms <= 0) {
        setIsPast(true);
        setDiff(null);
        return;
      }
      const days = Math.floor(ms / (24 * 60 * 60 * 1000));
      const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
      const secs = Math.floor((ms % (60 * 1000)) / 1000);
      setDiff({ days, hours, mins, secs });
      setIsPast(false);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate, targetTime]);

  return { diff, isPast };
}

// Найближча майбутня подія
function getNextEvent(events: Event[]): Event | null {
  const now = new Date();
  for (const e of events) {
    const d = new Date(e.event_date);
    if (e.event_time) {
      const [h, m] = e.event_time.split(':').map(Number);
      d.setHours(h ?? 0, m ?? 0, 0, 0);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    if (d >= now) return e;
  }
  return null;
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ currentUser, onToast }) => {
  const [bells, setBells] = useState<BellSlot[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBells, setEditingBells] = useState(false);
  const [localBells, setLocalBells] = useState<BellSlot[]>([]);
  const [savingBells, setSavingBells] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', event_date: '', event_time: '', description: '' });
  const [savingEvent, setSavingEvent] = useState(false);

  const isAdmin = isSchoolAdmin(currentUser.role);
  const nextEvent = getNextEvent(events);
  const { diff, isPast } = useCountdown(nextEvent?.event_date ?? null, nextEvent?.event_time ?? null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, e] = await Promise.all([fetchBellSchedule(), fetchEvents()]);
      setBells(b);
      setLocalBells(b.length ? [...b] : []);
      setEvents(e);
    } catch (err) {
      onToast?.('error', 'Не вдалося завантажити розклад');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveBells = async () => {
    if (!isAdmin || localBells.length === 0) return;
    setSavingBells(true);
    try {
      await upsertBellSchedule(
        localBells.map(({ id, ...rest }) => rest),
        currentUser.role
      );
      await load();
      setEditingBells(false);
      onToast?.('success', 'Розклад дзвінків збережено');
    } catch (err) {
      onToast?.('error', 'Не вдалося зберегти');
    } finally {
      setSavingBells(false);
    }
  };

  const handleAddBellRow = () => {
    const nextNum = Math.max(0, ...localBells.map(b => b.lesson_number)) + 1;
    setLocalBells([...localBells, { id: '', lesson_number: nextNum, start_time: '08:00', end_time: '08:45', name: '' }]);
  };

  const handleRemoveBellRow = (idx: number) => {
    setLocalBells(localBells.filter((_, i) => i !== idx));
  };

  const handleUpdateBell = (idx: number, field: keyof BellSlot, value: string | number) => {
    const next = [...localBells];
    (next[idx] as any)[field] = value;
    setLocalBells(next);
  };

  const openEventForm = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        event_date: event.event_date,
        event_time: event.event_time || '',
        description: event.description || ''
      });
    } else {
      setEditingEvent(null);
      const today = new Date().toISOString().slice(0, 10);
      setEventForm({ title: '', event_date: today, event_time: '', description: '' });
    }
    setShowEventForm(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.event_date) {
      onToast?.('error', 'Заповніть назву та дату');
      return;
    }
    setSavingEvent(true);
    try {
      if (editingEvent) {
        await updateEvent(
          editingEvent.id,
          {
            title: eventForm.title,
            event_date: eventForm.event_date,
            event_time: eventForm.event_time || undefined,
            description: eventForm.description || undefined
          },
          currentUser.role
        );
        onToast?.('success', 'Подія оновлена');
      } else {
        await createEvent(
          {
            title: eventForm.title,
            event_date: eventForm.event_date,
            event_time: eventForm.event_time || undefined,
            description: eventForm.description || undefined
          },
          currentUser.id,
          currentUser.role
        );
        onToast?.('success', 'Подія створена');
      }
      await load();
      setShowEventForm(false);
    } catch (err) {
      onToast?.('error', 'Не вдалося зберегти подію');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (e: Event) => {
    if (!confirm(`Видалити подію «${e.title}»?`)) return;
    try {
      await deleteEvent(e.id, currentUser.role);
      await load();
      onToast?.('success', 'Подія видалена');
    } catch (err) {
      onToast?.('error', 'Не вдалося видалити');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#0095f6]" size={32} />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-0 animate-fade-in space-y-6">
      {/* Countdown to nearest event */}
      {nextEvent && !isPast && diff && (
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-xl p-3 sm:p-4 text-white shadow-lg">
          <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
            <Bell size={18} className="flex-shrink-0 sm:w-5 sm:h-5" />
            <span className="font-bold text-sm sm:text-base truncate">Найближча подія: {nextEvent.title}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <div className="bg-white/20 backdrop-blur rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-center min-w-[52px] sm:min-w-[58px]">
              <div className="text-lg sm:text-xl font-black leading-tight">{diff.days}</div>
              <div className="text-[10px] sm:text-xs font-semibold opacity-90">днів</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-center min-w-[52px] sm:min-w-[58px]">
              <div className="text-lg sm:text-xl font-black leading-tight">{diff.hours}</div>
              <div className="text-[10px] sm:text-xs font-semibold opacity-90">год</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-center min-w-[52px] sm:min-w-[58px]">
              <div className="text-lg sm:text-xl font-black leading-tight">{diff.mins}</div>
              <div className="text-[10px] sm:text-xs font-semibold opacity-90">хв</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-center min-w-[52px] sm:min-w-[58px]">
              <div className="text-lg sm:text-xl font-black leading-tight">{diff.secs}</div>
              <div className="text-[10px] sm:text-xs font-semibold opacity-90">сек</div>
            </div>
          </div>
          <p className="text-white/90 text-[11px] sm:text-xs mt-2 line-clamp-1">
            {new Date(nextEvent.event_date).toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            {nextEvent.event_time && ` о ${nextEvent.event_time}`}
          </p>
        </div>
      )}

      {/* Bell schedule */}
      <div className="bg-white dark:bg-[#171717] rounded-2xl border border-[#efefef] dark:border-[#262626] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#efefef] dark:border-[#262626]">
          <h2 className="font-bold text-lg text-[#262626] dark:text-[#fafafa] flex items-center gap-2">
            <Clock size={20} /> Розклад дзвінків
          </h2>
          {isAdmin && (
            editingBells ? (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setEditingBells(false); setLocalBells([...bells]); }}>
                  Скасувати
                </Button>
                <Button size="sm" onClick={handleSaveBells} disabled={savingBells} isLoading={savingBells}>
                  <Save size={16} /> Зберегти
                </Button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingBells(true);
                  setLocalBells(bells.length ? [...bells] : [{ id: '', lesson_number: 1, start_time: '08:00', end_time: '08:45', name: '' }]);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0095f6] text-white text-sm font-semibold hover:bg-[#0077cc]"
              >
                <Pencil size={16} /> Редагувати
              </button>
            )
          )}
        </div>
        <div className="overflow-x-auto">
          {editingBells ? (
            <div className="p-4 space-y-2">
              {localBells.map((b, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    className="w-14 bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-lg px-2 py-1.5 text-sm font-bold text-[#262626] dark:text-[#fafafa]"
                    value={b.lesson_number}
                    onChange={e => handleUpdateBell(idx, 'lesson_number', parseInt(e.target.value) || 0)}
                  />
                  <input
                    type="time"
                    className="bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-lg px-2 py-1.5 text-sm text-[#262626] dark:text-[#fafafa]"
                    value={b.start_time}
                    onChange={e => handleUpdateBell(idx, 'start_time', e.target.value)}
                  />
                  <span className="text-slate-400 dark:text-[#737373]">–</span>
                  <input
                    type="time"
                    className="bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-lg px-2 py-1.5 text-sm text-[#262626] dark:text-[#fafafa]"
                    value={b.end_time}
                    onChange={e => handleUpdateBell(idx, 'end_time', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 min-w-[120px] bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-lg px-2 py-1.5 text-sm text-[#262626] dark:text-[#fafafa] placeholder-[#737373] dark:placeholder-[#a3a3a3]"
                    placeholder="Назва уроку (опц.)"
                    value={b.name || ''}
                    onChange={e => handleUpdateBell(idx, 'name', e.target.value)}
                  />
                  <button
                    onClick={() => handleRemoveBellRow(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddBellRow}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-[#404040] text-slate-500 hover:border-[#0095f6] hover:text-[#0095f6] text-sm font-medium"
              >
                <Plus size={18} /> Додати урок
              </button>
            </div>
          ) : bells.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafafa] dark:bg-[#262626] text-left text-sm font-semibold text-[#737373] dark:text-[#a3a3a3]">
                  <th className="p-3">№</th>
                  <th className="p-3">Початок</th>
                  <th className="p-3">Кінець</th>
                  <th className="p-3">Назва</th>
                </tr>
              </thead>
              <tbody>
                {bells.map(b => (
                  <tr key={b.id || b.lesson_number} className="border-t border-[#efefef] dark:border-[#262626]">
                    <td className="p-3 font-bold text-[#262626] dark:text-[#fafafa]">{b.lesson_number}</td>
                    <td className="p-3 text-[#262626] dark:text-[#fafafa]">{b.start_time}</td>
                    <td className="p-3 text-[#262626] dark:text-[#fafafa]">{b.end_time}</td>
                    <td className="p-3 text-[#737373] dark:text-[#a3a3a3]">{b.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-[#737373] dark:text-[#a3a3a3]">
              Розклад дзвінків ще не додано
              {isAdmin && (
                <button
                  onClick={() => { setEditingBells(true); handleAddBellRow(); }}
                  className="block mt-2 text-[#0095f6] font-semibold"
                >
                  Додати розклад
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Events */}
      <div className="bg-white dark:bg-[#171717] rounded-2xl border border-[#efefef] dark:border-[#262626] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#efefef] dark:border-[#262626]">
          <h2 className="font-bold text-lg text-[#262626] dark:text-[#fafafa] flex items-center gap-2">
            <Calendar size={20} /> Події та свята
          </h2>
          {isAdmin && (
            <button
              onClick={() => openEventForm()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0095f6] text-white text-sm font-semibold hover:bg-[#0077cc]"
            >
              <Plus size={16} /> Додати подію
            </button>
          )}
        </div>
        <div className="p-4 space-y-3">
          {events.length === 0 ? (
            <div className="py-8 text-center text-[#737373] dark:text-[#a3a3a3]">
              Подій поки немає
              {isAdmin && (
                <button onClick={() => openEventForm()} className="block mt-2 text-[#0095f6] font-semibold">
                  Створити подію
                </button>
              )}
            </div>
          ) : (
            events.map(e => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#fafafa] dark:bg-[#262626] border border-[#efefef] dark:border-[#404040]"
              >
                <div>
                  <div className="font-bold text-[#262626] dark:text-[#fafafa]">{e.title}</div>
                  <div className="text-sm text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                    {new Date(e.event_date).toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    {e.event_time && ` о ${e.event_time}`}
                  </div>
                  {e.description && <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mt-2">{e.description}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEventForm(e)}
                      className="p-2 text-[#0095f6] hover:bg-[#0095f6]/10 rounded-lg"
                      aria-label="Редагувати"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(e)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      aria-label="Видалити"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Event form modal */}
      {showEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#171717] w-full max-w-md rounded-2xl shadow-xl p-6 border border-[#efefef] dark:border-[#262626]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#262626] dark:text-[#fafafa]">{editingEvent ? 'Редагувати подію' : 'Нова подія'}</h3>
              <button onClick={() => setShowEventForm(false)} className="p-2 text-[#262626] dark:text-[#fafafa] hover:bg-slate-100 dark:hover:bg-[#262626] rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#737373] dark:text-[#a3a3a3] mb-1">Назва</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-xl px-4 py-3 text-[#262626] dark:text-[#fafafa] placeholder-[#737373] dark:placeholder-[#a3a3a3]"
                  placeholder="Наприклад: Новий рік"
                  value={eventForm.title}
                  onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#737373] dark:text-[#a3a3a3] mb-1">Дата</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-xl px-4 py-3 text-[#262626] dark:text-[#fafafa]"
                  value={eventForm.event_date}
                  onChange={e => setEventForm(f => ({ ...f, event_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#737373] dark:text-[#a3a3a3] mb-1">Час (опц.)</label>
                <input
                  type="time"
                  className="w-full bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-xl px-4 py-3 text-[#262626] dark:text-[#fafafa]"
                  value={eventForm.event_time}
                  onChange={e => setEventForm(f => ({ ...f, event_time: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#737373] dark:text-[#a3a3a3] mb-1">Опис (опц.)</label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-xl px-4 py-3 resize-none text-[#262626] dark:text-[#fafafa] placeholder-[#737373] dark:placeholder-[#a3a3a3]"
                  rows={3}
                  placeholder="Короткий опис події..."
                  value={eventForm.description}
                  onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setShowEventForm(false)}>Скасувати</Button>
              <Button onClick={handleSaveEvent} disabled={savingEvent} isLoading={savingEvent}>Зберегти</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
