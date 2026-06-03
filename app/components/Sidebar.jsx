'use client';

import { Calendar, ChevronRight } from 'lucide-react';
import { formatDateShort } from '../lib/utils';

export default function Sidebar({ allDates, selectedDate, onSelectDate }) {
  return (
    <aside className="hidden md:block md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-h-[80vh] overflow-y-auto sticky top-24 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-editorial-accent" />
          <span>历史归档</span>
        </h2>
        <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
          {allDates.length} 期
        </span>
      </div>

      <div className="space-y-1">
        {allDates.map(date => (
          <button
            key={date}
            onClick={() => onSelectDate(date)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all text-left ${
              date === selectedDate
                ? 'bg-red-50 dark:bg-red-950/20 text-editorial-accent dark:text-red-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 opacity-60" />
              <span>{formatDateShort(date)}</span>
            </div>
            <ChevronRight className={`w-3 h-3 transition-opacity ${date === selectedDate ? 'opacity-100' : 'opacity-0'}`} />
          </button>
        ))}
      </div>
    </aside>
  );
}
