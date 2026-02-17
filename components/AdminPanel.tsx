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
  ShieldCheck
} from 'lucide-react';
import { BellSlot, Event, User } from '../types';
import {
  fetchBellSchedule,
  fetchEvents,
  upsertBellSchedule,
  createEvent,
  updateEvent,
  deleteEvent
} from '../services/api';
import { Button } from './Button';

interface AdminPanelProps {
  currentUser: User;
  onToast?: (type: 'success' | 'error' | 'loading', msg: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onToast }) => {
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, e] = await Promise.all([fetchBellSchedule(), fetchEvents()]);
      setBells(b);
      setLocalBells(b.length ? [...b] : []);
      setEvents(e);
    } catch (err) {
      onToast?.('error', 'Не вдалося завантажити');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveBells = async () => {
    if (localBells.length === 0) return;
    setSavingBells(true);
    try {
      await upsertBellSchedule(localBells.map(({ id, ...rest }) => rest), currentUser.role);
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
      setEventForm({ title: '', event_date: new Date().toISOString().slice(0, 10), event_time: '', description: '' });
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
          { title: eventForm.title, event_date: eventForm.event_date, event_time: eventForm.event_time || undefined, description: eventForm.description || undefined },
          currentUser.role
        );
        onToast?.('success', 'Подія оновлена');
      } else {
        await createEvent(
          { title: eventForm.title, event_date: eventForm.event_date, event_time: eventForm.event_time || undefined, description: eventForm.description || undefined },
          currentUser.id,
          currentUser.role
        );
        onToast?.('success', 'Подія створена');
      }
      await load();
      setShowEventForm(false);
    } catch (err) {
      onToast?.('error', 'Не вдалося зберегти');
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
    <div className="pb-24 md:pb-0 animate-fade-in space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <ShieldCheck className="text-amber-600 dark:text-amber-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#262626] dark:text-[#fafafa]">Панель адміністратора</h1>
          <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">Керування розкладом дзвінків та подіями</p>
        </div>
      </div>

      {/* Bell Schedule */}
      <section className="bg-white dark:bg-[#171717] rounded-2xl border border-[#efefef] dark:border-[#404040] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#efefef] dark:border-[#404040]">
          <h2 className="font-bold text-lg text-[#262626] dark:text-[#fafafa] flex items-center gap-2">
            <Clock size={20} /> Розклад дзвінків
          </h2>
          {editingBells ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setEditingBells(false); setLocalBells([...bells]); }}>Скасувати</Button>
              <Button size="sm" onClick={handleSaveBells} disabled={savingBells} isLoading={savingBells}><Save size={16} /> Зберегти</Button>
            </div>
          ) : (
            <button
              onClick={() => { setEditingBells(true); setLocalBells(bells.length ? [...bells] : [{ id: '', lesson_number: 1, start_time: '08:00', end_time: '08:45', name: '' }]); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0095f6] text-white text-sm font-semibold hover:bg-[#0077cc]"
            >
              <Pencil size={16} /> Редагувати
            </button>
          )}
        </div>
        <div className="p-5">
          {editingBells ? (
            <div className="space-y-3">
              {localBells.map((b, idx) => (
                <div key={idx} className="flex items-center gap-3 flex-wrap">
                  <input type="number" className="w-16 bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-lg px-3 py-2 text-sm font-bold text-[#262626] dark:text-[#fafafa]" value={b.lesson_number} onChange={e => handleUpdateBell(idx, 'lesson_number', parseInt(e.target.value) || 0)} />
                  <input type="time" className="bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-[#262626] dark:text-[#fafafa]" value={b.start_time} onChange={e => handleUpdateBell(idx, 'start_time', e.target.value)} />
                  <span className="text-slate-400 dark:text-[#737373]">–</span>
                  <input type="time" className="bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-[#262626] dark:text-[#fafafa]" value={b.end_time} onChange={e => handleUpdateBell(idx, 'end_time', e.target.value)} />
                  <input type="text" className="flex-1 min-w-[140px] bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-[#262626] dark:text-[#fafafa] placeholder-[#737373] dark:placeholder-[#a3a3a3]" placeholder="Назва уроку (опц.)" value={b.name || ''} onChange={e => handleUpdateBell(idx, 'name', e.target.value)} />
                  <button onClick={() => setLocalBells(localBells.filter((_, i) => i !== idx))} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><Trash2 size={18} /></button>
                </div>
              ))}
              <button onClick={handleAddBellRow} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-[#404040] text-slate-500 hover:border-[#0095f6] hover:text-[#0095f6] text-sm font-medium">
                <Plus size={18} /> Додати урок
              </button>
            </div>
          ) : bells.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#fafafa] dark:bg-[#262626] text-left text-sm font-semibold text-[#737373] dark:text-[#a3a3a3]">
                    <th className="p-3">№</th><th className="p-3">Початок</th><th className="p-3">Кінець</th><th className="p-3">Назва</th>
                  </tr>
                </thead>
                <tbody>
                  {bells.map(b => (
                    <tr key={b.id || b.lesson_number} className="border-t border-[#efefef] dark:border-[#404040]">
                      <td className="p-3 font-bold text-[#262626] dark:text-[#fafafa]">{b.lesson_number}</td>
                      <td className="p-3 text-[#262626] dark:text-[#fafafa]">{b.start_time}</td>
                      <td className="p-3 text-[#262626] dark:text-[#fafafa]">{b.end_time}</td>
                      <td className="p-3 text-[#737373] dark:text-[#a3a3a3]">{b.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-[#737373] dark:text-[#a3a3a3]">Розклад ще не додано. Натисніть «Редагувати» щоб створити.</p>
          )}
        </div>
      </section>

      {/* Events */}
      <section className="bg-white dark:bg-[#171717] rounded-2xl border border-[#efefef] dark:border-[#404040] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#efefef] dark:border-[#404040]">
          <h2 className="font-bold text-lg text-[#262626] dark:text-[#fafafa] flex items-center gap-2">
            <Calendar size={20} /> Події та свята
          </h2>
          <button onClick={() => openEventForm()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0095f6] text-white text-sm font-semibold hover:bg-[#0077cc]">
            <Plus size={16} /> Створити подію
          </button>
        </div>
        <div className="p-5 space-y-3">
          {events.length === 0 ? (
            <p className="text-center py-8 text-[#737373] dark:text-[#a3a3a3]">Подій поки немає. Створіть першу подію.</p>
          ) : (
            events.map(e => (
              <div key={e.id} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#fafafa] dark:bg-[#262626] border border-[#efefef] dark:border-[#404040]">
                <div>
                  <div className="font-bold text-[#262626] dark:text-[#fafafa]">{e.title}</div>
                  <div className="text-sm text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                    {new Date(e.event_date).toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    {e.event_time && ` о ${e.event_time}`}
                  </div>
                  {e.description && <p className="text-sm text-[#525252] dark:text-[#a3a3a3] mt-2">{e.description}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEventForm(e)} className="p-2 text-[#0095f6] hover:bg-[#0095f6]/10 rounded-lg"><Pencil size={18} /></button>
                  <button onClick={() => handleDeleteEvent(e)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {showEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#171717] w-full max-w-md rounded-2xl shadow-xl p-6 border border-[#efefef] dark:border-[#404040]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#262626] dark:text-[#fafafa]">{editingEvent ? 'Редагувати подію' : 'Нова подія'}</h3>
              <button onClick={() => setShowEventForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-[#262626] rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#737373] dark:text-[#a3a3a3] mb-1">Назва</label>
                <input type="text" className="w-full bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-xl px-4 py-3 text-[#262626] dark:text-[#fafafa]" placeholder="Наприклад: Новий рік" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#737373] dark:text-[#a3a3a3] mb-1">Дата</label>
                <input type="date" className="w-full bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-xl px-4 py-3" value={eventForm.event_date} onChange={e => setEventForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#737373] dark:text-[#a3a3a3] mb-1">Час (опц.)</label>
                <input type="time" className="w-full bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-xl px-4 py-3" value={eventForm.event_time} onChange={e => setEventForm(f => ({ ...f, event_time: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#737373] dark:text-[#a3a3a3] mb-1">Опис (опц.)</label>
                <textarea className="w-full bg-slate-50 dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040] rounded-xl px-4 py-3 resize-none text-[#262626] dark:text-[#fafafa]" rows={3} placeholder="Короткий опис події..." value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} />
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
