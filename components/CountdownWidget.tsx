import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Event } from '../types';
import { fetchNextEvent } from '../services/api';

export const CountdownWidget: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [diff, setDiff] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    fetchNextEvent().then((e) => {
      setEvent(e);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!event) return;
    const update = () => {
      const now = new Date();
      const d = new Date(event.event_date);
      if (event.event_time) {
        const [h, m] = event.event_time.split(':').map(Number);
        d.setHours(h ?? 0, m ?? 0, 0, 0);
      } else {
        d.setHours(0, 0, 0, 0);
      }
      const ms = d.getTime() - now.getTime();
      if (ms <= 0) {
        setIsPast(true);
        setDiff(null);
        return;
      }
      setDiff({
        d: Math.floor(ms / 86400000),
        h: Math.floor((ms % 86400000) / 3600000),
        m: Math.floor((ms % 3600000) / 60000),
        s: Math.floor((ms % 60000) / 1000)
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [event]);

  if (loading || !event || isPast) return null;

  return (
    <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-2xl p-4 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={18} />
        <span className="font-bold text-sm">{event.title}</span>
      </div>
      {diff && (
        <div className="flex gap-2 flex-wrap">
          {[
            { v: diff.d, l: 'д' },
            { v: diff.h, l: 'год' },
            { v: diff.m, l: 'хв' },
            { v: diff.s, l: 'сек' }
          ].map(({ v, l }) => (
            <div key={l} className="bg-white/20 backdrop-blur rounded-lg px-2 py-1.5 text-center min-w-[44px]">
              <div className="text-lg font-black leading-tight">{v}</div>
              <div className="text-[10px] font-semibold opacity-90">{l}</div>
            </div>
          ))}
        </div>
      )}
      <p className="text-white/90 text-xs mt-2">
        {new Date(event.event_date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}
        {event.event_time && ` о ${event.event_time}`}
      </p>
    </div>
  );
};
